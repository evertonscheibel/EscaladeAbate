import PcpMotivoParada from '../models/PcpMotivoParada.js';
import PcpEvento from '../models/PcpEvento.js';

// ─── CRUD: Motivos de Parada ─────────────────────────
export const getMotivos = async (req, res) => {
    try {
        const motivos = await PcpMotivoParada.find().sort({ categoria: 1, nome: 1 });
        res.json({ success: true, data: motivos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMotivo = async (req, res) => {
    try {
        const motivo = await PcpMotivoParada.create(req.body);
        res.status(201).json({ success: true, data: motivo });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Motivo já cadastrado.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMotivo = async (req, res) => {
    try {
        const motivo = await PcpMotivoParada.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!motivo) return res.status(404).json({ success: false, message: 'Motivo não encontrado.' });
        res.json({ success: true, data: motivo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMotivo = async (req, res) => {
    try {
        const motivo = await PcpMotivoParada.findByIdAndDelete(req.params.id);
        if (!motivo) return res.status(404).json({ success: false, message: 'Motivo não encontrado.' });
        res.json({ success: true, message: 'Motivo removido.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Análise de Paradas ──────────────────────────────
export const getDowntimeAnalysis = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Buscar eventos de STOP com motivo de parada no período
        const stopEvents = await PcpEvento.find({
            tipo: 'STOP',
            timestamp: { $gte: start, $lte: end },
            motivoParadaId: { $exists: true, $ne: null }
        }).populate('motivoParadaId', 'nome categoria improdutivo');

        // Buscar todos os eventos de RESUME para calcular duração
        const resumeEvents = await PcpEvento.find({
            tipo: { $in: ['RESUME', 'FINISH'] },
            timestamp: { $gte: start, $lte: end }
        }).sort({ timestamp: 1 });

        // Calcular duração de cada parada
        const downtimeEntries = stopEvents.map(stop => {
            const nextResume = resumeEvents.find(r =>
                r.opId?.toString() === stop.opId?.toString() &&
                r.timestamp > stop.timestamp
            );
            const durationMin = nextResume
                ? Math.round((nextResume.timestamp - stop.timestamp) / 60000)
                : 0;

            return {
                motivo: stop.motivoParadaId?.nome || 'Desconhecido',
                categoria: stop.motivoParadaId?.categoria || 'OUTROS',
                improdutivo: stop.motivoParadaId?.improdutivo ?? true,
                durationMin,
                date: stop.timestamp,
                observacao: stop.observacao
            };
        });

        // Agregar por motivo (Pareto)
        const byMotivo = {};
        const byCategoria = {};
        downtimeEntries.forEach(entry => {
            if (!byMotivo[entry.motivo]) byMotivo[entry.motivo] = { count: 0, totalMin: 0 };
            byMotivo[entry.motivo].count++;
            byMotivo[entry.motivo].totalMin += entry.durationMin;

            if (!byCategoria[entry.categoria]) byCategoria[entry.categoria] = { count: 0, totalMin: 0 };
            byCategoria[entry.categoria].count++;
            byCategoria[entry.categoria].totalMin += entry.durationMin;
        });

        const paretoData = Object.entries(byMotivo)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.totalMin - a.totalMin);

        const categoryData = Object.entries(byCategoria)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.totalMin - a.totalMin);

        const totalDowntimeMin = downtimeEntries.reduce((s, e) => s + e.durationMin, 0);

        res.json({
            success: true,
            data: {
                totalEvents: downtimeEntries.length,
                totalDowntimeMin,
                paretoData,
                categoryData,
                recentEvents: downtimeEntries.slice(0, 20)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
