import ChecklistExecution from '../models/ChecklistExecution.js';
import ChecklistModel from '../models/ChecklistModel.js';
import { paginate } from '../utils/paginationHelper.js';
import crypto from 'crypto';

/**
 * GET /api/checklist-executions
 */
export const getChecklistExecutions = async (req, res, next) => {
    try {
        const { area, status, start, end, turno } = req.query;
        const filter = {};

        if (area) filter.area = area;
        if (status) filter.status = status;
        if (turno) filter.turno = turno;
        if (start && end) {
            filter.data_hora_abertura = { $gte: new Date(start), $lte: new Date(end) };
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort || '-data_hora_abertura',
            populate: [
                { path: 'modelo', select: 'titulo codigo' },
                { path: 'area', select: 'nome codigo' },
                { path: 'executor', select: 'name' }
            ]
        };

        const result = await paginate(ChecklistExecution, filter, options);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/checklist-executions (Abertura Manual)
 */
export const openChecklistExecution = async (req, res, next) => {
    try {
        const { modeloId, areaId, turno } = req.body;

        const count = await ChecklistExecution.countDocuments();
        const codigo = `EX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(count + 1).toString().padStart(4, '0')}`;

        const execution = await ChecklistExecution.create({
            codigo_execucao: codigo,
            modelo: modeloId,
            area: areaId,
            turno,
            executor: req.user._id,
            status: 'Em andamento'
        });

        res.status(201).json({ success: true, data: execution });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/checklist-executions/:id (Responder item)
 */
export const updateChecklistExecution = async (req, res, next) => {
    try {
        const execution = await ChecklistExecution.findById(req.params.id);
        if (!execution) return res.status(404).json({ success: false, message: 'Execução não encontrada' });

        if (execution.status !== 'Em andamento') {
            return res.status(403).json({ success: false, message: 'Não é possível editar uma execução finalizada' });
        }

        // Atualiza campos e respostas
        Object.assign(execution, req.body);
        await execution.save();

        res.json({ success: true, data: execution });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/checklist-executions/:id/finalize (Fluxo 3)
 */
export const finalizeChecklistExecution = async (req, res, next) => {
    try {
        const execution = await ChecklistExecution.findById(req.params.id);
        if (!execution) return res.status(404).json({ success: false, message: 'Execução não encontrada' });

        if (execution.status !== 'Em andamento') {
            return res.status(400).json({ success: false, message: 'Execução já finalizada ou cancelada' });
        }

        // Validação básica (Fluxo 3 - Ação 1)
        // Aqui deve-se buscar o modelo para saber quais itens são obrigatórios
        const model = await ChecklistModel.findById(execution.modelo);
        const mandatoryItemIds = model.itens.filter(i => i.obrigatorio).map(i => i._id.toString());
        const respondedItemIds = execution.respostas.map(r => r.item_ref.toString());

        const pending = mandatoryItemIds.filter(id => !respondedItemIds.includes(id));
        if (pending.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Existem itens obrigatórios pendentes',
                pending
            });
        }

        // Cálculos (Fluxo 3 - Ação 2)
        const total = execution.respostas.length;
        const ok = execution.respostas.filter(r => r.resultado === 'OK').length;
        const nok = execution.respostas.filter(r => r.resultado === 'NOK').length;
        const na = execution.respostas.filter(r => r.resultado === 'N/A').length;

        execution.total_itens = total;
        execution.total_ok = ok;
        execution.total_nok = nok;
        execution.total_na = na;
        execution.data_hora_fechamento = new Date();
        execution.status = (nok > 0 || execution.tem_nc) ? 'Finalizado com NC' : 'Finalizado';

        // Hash de Integridade (Fluxo 3 - Ação 3)
        const hashBase = `${execution.codigo_execucao}|${execution.executor}|${execution.data_hora_fechamento.toISOString()}|${total}`;
        execution.hash_integridade = crypto.createHash('md5').update(hashBase).digest('hex');

        await execution.save();

        res.json({ success: true, data: execution, message: 'Execução finalizada com imutabilidade registrada' });
    } catch (error) {
        next(error);
    }
};
