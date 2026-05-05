import PcpOp from '../models/PcpOp.js';
import PcpEvento from '../models/PcpEvento.js';
import PcpMotivoParada from '../models/PcpMotivoParada.js';
import PcpParametroCusto from '../models/PcpParametroCusto.js';
import DeboningSchedule from '../models/DeboningSchedule.js';
import DeboningLot from '../models/DeboningLot.js';

// ... (previous methods)

// @desc    Obter consolidado de indicadores, custos e rendimento
// @route   GET /api/pcp/programacoes/:id/analytics
export const getPcpAnalytics = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ops = await PcpOp.find({ programacaoId: id });
        const programacao = await DeboningSchedule.findById(id);

        if (!ops || ops.length === 0) {
            return res.json({ success: true, data: { summary: {}, ops: [] } });
        }

        // Buscar parâmetros de custo vigentes para a data da programação
        const paramCusto = await PcpParametroCusto.findOne({
            vigenciaInicio: { $lte: programacao.scheduleDate },
            vigenciaFim: { $gte: programacao.scheduleDate }
        }) || await PcpParametroCusto.findOne().sort({ createdAt: -1 });

        const analyticsOps = ops.map(op => {
            const horasBase = paramCusto?.incluirTempoParadoNoCusto
                ? (op.tempoTotalMin / 60)
                : (op.tempoProdutivoMin / 60);

            const custoMaoObra = horasBase * (paramCusto?.custoMaoDeObraHora || 0);
            const custoOverhead = horasBase * (paramCusto?.custoOverheadHora || 0);
            const custoEmbalagem = op.qtdReal * (paramCusto?.custoEmbalagemPorPeca || 0);
            const custoInsumos = op.pesoRealKg * (paramCusto?.custoInsumosPorKg || 0);
            const custoParadas = (op.tempoParadoMin / 60) * (paramCusto?.custoParadaHora || 0);

            const custoTotal = custoMaoObra + custoOverhead + custoEmbalagem + custoInsumos + custoParadas;

            return {
                ...op.toObject(),
                custoTotal: custoTotal.toFixed(2),
                custoPorKg: op.pesoRealKg > 0 ? (custoTotal / op.pesoRealKg).toFixed(2) : 0,
                custoPorPeca: op.qtdReal > 0 ? (custoTotal / op.qtdReal).toFixed(2) : 0
            };
        });

        // Consolidado Global
        const totalPecas = analyticsOps.reduce((acc, o) => acc + o.qtdReal, 0);
        const totalKg = analyticsOps.reduce((acc, o) => acc + o.pesoRealKg, 0);
        const totalEntradaKg = analyticsOps.reduce((acc, o) => acc + (o.origemEntradaKg || o.pesoPlanejadoKg), 0);
        const totalCusto = analyticsOps.reduce((acc, o) => acc + parseFloat(o.custoTotal), 0);
        const totalTempoProdutivo = analyticsOps.reduce((acc, o) => acc + o.tempoProdutivoMin, 0);
        const totalTempoParado = analyticsOps.reduce((acc, o) => acc + o.tempoParadoMin, 0);

        // Pareto de Paradas
        const eventos = await PcpEvento.find({ programacaoId: id, tipo: 'STOP' }).populate('motivoParadaId');
        const nextEvents = await PcpEvento.find({ programacaoId: id, tipo: { $in: ['RESUME', 'FINISH'] } }).sort({ timestamp: 1 });

        const paretos = {};
        eventos.forEach(evt => {
            const motivo = evt.motivoParadaId?.nome || 'Não Informado';
            const resolve = nextEvents.find(n => n.opId.toString() === evt.opId.toString() && n.timestamp > evt.timestamp);
            const duracao = resolve ? (resolve.timestamp - evt.timestamp) / (1000 * 60) : 0;

            if (!paretos[motivo]) paretos[motivo] = { minutos: 0, count: 0 };
            paretos[motivo].minutos += duracao;
            paretos[motivo].count += 1;
        });

        const paretoData = Object.keys(paretos)
            .map(name => ({ name, value: Math.round(paretos[name].minutos), occurrences: paretos[name].count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                summary: {
                    totalPecas,
                    totalKg,
                    totalEntradaKg,
                    rendimentoGlobal: totalEntradaKg > 0 ? ((totalKg / totalEntradaKg) * 100).toFixed(2) : 0,
                    totalCusto: totalCusto.toFixed(2),
                    custoMedioKg: totalKg > 0 ? (totalCusto / totalKg).toFixed(2) : 0,
                    pecasHoraGlobal: totalTempoProdutivo > 0 ? (totalPecas / (totalTempoProdutivo / 60)).toFixed(1) : 0,
                    totalTempoProdutivo,
                    totalTempoParado
                },
                ops: analyticsOps,
                pareto: paretoData
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Listar motivos de parada
// @route   GET /api/pcp/motivos-parada
export const getMotivosParada = async (req, res, next) => {
    try {
        const motivos = await PcpMotivoParada.find({ ativo: true }).sort({ nome: 1 });
        res.json({ success: true, data: motivos });
    } catch (error) {
        next(error);
    }
};

// @desc    Iniciar uma OP
// @route   POST /api/pcp/ops/:opId/iniciar
export const iniciarOp = async (req, res, next) => {
    try {
        const { opId } = req.params;
        const op = await PcpOp.findById(opId);

        if (!op) return res.status(404).json({ success: false, message: 'OP não encontrada' });
        if (op.status === 'FINALIZADA') return res.status(400).json({ success: false, message: 'OP já finalizada' });

        const now = new Date();

        // Se for o primeiro início
        if (!op.inicioReal) {
            op.inicioReal = now;
        }

        op.status = 'EM_EXECUCAO';
        await op.save();

        await PcpEvento.create({
            programacaoId: op.programacaoId,
            opId: op._id,
            tipo: 'START',
            timestamp: now,
            usuarioId: req.user.id
        });

        res.json({ success: true, data: op });
    } catch (error) {
        next(error);
    }
};

// @desc    Pausar uma OP
// @route   POST /api/pcp/ops/:opId/pausar
export const pausarOp = async (req, res, next) => {
    try {
        const { opId } = req.params;
        const { motivoParadaId, observacao } = req.body;

        const op = await PcpOp.findById(opId);
        if (!op || op.status !== 'EM_EXECUCAO') {
            return res.status(400).json({ success: false, message: 'OP deve estar em execução para pausar' });
        }

        const motivo = await PcpMotivoParada.findById(motivoParadaId);
        if (!motivo) return res.status(400).json({ success: false, message: 'Motivo de parada inválido' });

        const now = new Date();
        op.status = 'PAUSADA';
        await op.save();

        await PcpEvento.create({
            programacaoId: op.programacaoId,
            opId: op._id,
            tipo: 'STOP',
            timestamp: now,
            motivoParadaId,
            observacao,
            usuarioId: req.user.id
        });

        res.json({ success: true, data: op });
    } catch (error) {
        next(error);
    }
};

// @desc    Retomar uma OP
// @route   POST /api/pcp/ops/:opId/retomar
export const retomarOp = async (req, res, next) => {
    try {
        const { opId } = req.params;
        const op = await PcpOp.findById(opId);

        if (!op || op.status !== 'PAUSADA') {
            return res.status(400).json({ success: false, message: 'OP deve estar pausada para retomar' });
        }

        const now = new Date();
        op.status = 'EM_EXECUCAO';
        await op.save();

        await PcpEvento.create({
            programacaoId: op.programacaoId,
            opId: op._id,
            tipo: 'RESUME',
            timestamp: now,
            usuarioId: req.user.id
        });

        res.json({ success: true, data: op });
    } catch (error) {
        next(error);
    }
};

// @desc    Finalizar uma OP
// @route   POST /api/pcp/ops/:opId/finalizar
export const finalizarOp = async (req, res, next) => {
    try {
        const { opId } = req.params;
        const { fimReal, qtdReal, pesoRealKg, observacao } = req.body;

        const op = await PcpOp.findById(opId);
        if (!op) return res.status(404).json({ success: false, message: 'OP não encontrada' });

        const dataFim = fimReal ? new Date(fimReal) : new Date();

        if (dataFim < op.inicioReal) {
            return res.status(400).json({ success: false, message: 'Fim real não pode ser anterior ao início' });
        }

        op.status = 'FINALIZADA';
        op.fimReal = dataFim;
        op.qtdReal = qtdReal;
        op.pesoRealKg = pesoRealKg || op.pesoPlanejadoKg;
        op.observacao = observacao;

        // Buscar todos os eventos desta OP para calcular tempos
        const eventos = await PcpEvento.find({ opId: op._id }).sort({ timestamp: 1 });

        let tempoParadoMin = 0;
        let lastStop = null;

        eventos.forEach(evt => {
            if (evt.tipo === 'STOP') {
                lastStop = evt.timestamp;
            } else if (evt.tipo === 'RESUME' && lastStop) {
                tempoParadoMin += (evt.timestamp - lastStop) / (1000 * 60);
                lastStop = null;
            }
        });

        // Se terminou pausada, conta o tempo da última pausa até o fimReal
        if (lastStop && lastStop < dataFim) {
            tempoParadoMin += (dataFim - lastStop) / (1000 * 60);
        }

        const tempoTotalMin = (dataFim - op.inicioReal) / (1000 * 60);
        op.tempoTotalMin = Math.round(tempoTotalMin);
        op.tempoParadoMin = Math.round(tempoParadoMin);
        op.tempoProdutivoMin = Math.max(0, op.tempoTotalMin - op.tempoParadoMin);

        if (op.tempoProdutivoMin > 0) {
            op.pecasPorHora = (op.qtdReal / (op.tempoProdutivoMin / 60)).toFixed(2);
            op.kgPorHora = (op.pesoRealKg / (op.tempoProdutivoMin / 60)).toFixed(2);
        }

        // Cálculo de Rendimento (Baseado em entrada vs saída)
        // origemEntradaKg pode ser o peso planejado se não vier do abate
        const entrada = op.origemEntradaKg || op.pesoPlanejadoKg;
        if (entrada > 0) {
            op.rendimentoPct = ((op.pesoRealKg / entrada) * 100).toFixed(2);
        }

        await op.save();

        // Sincronizar com DeboningLot para relatórios legados
        try {
            await DeboningLot.findByIdAndUpdate(opId, {
                lotStatus: 'CONCLUIDO',
                totalProduzidoKg: op.pesoRealKg
            });
        } catch (syncError) {
            console.error('Erro ao sincronizar OP com Lote:', syncError);
        }

        await PcpEvento.create({
            programacaoId: op.programacaoId,
            opId: op._id,
            tipo: 'FINISH',
            timestamp: dataFim,
            usuarioId: req.user.id,
            metadata: { manual: !!fimReal }
        });

        res.json({ success: true, data: op });
    } catch (error) {
        next(error);
    }
};
