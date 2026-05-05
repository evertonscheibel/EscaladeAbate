import ExternalLot from '../models/ExternalLot.js';

// @desc    Listar lotes externos
// @route   GET /api/pcp/external-lots
export const getExternalLots = async (req, res, next) => {
    try {
        const { date } = req.query;
        const query = {};
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            query.arrivalDate = { $gte: start, $lt: end };
        }

        const lots = await ExternalLot.find(query).sort('-arrivalDate');
        res.json({ success: true, data: lots });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar lote externo
// @route   POST /api/pcp/external-lots
export const createExternalLot = async (req, res, next) => {
    try {
        const lotData = { ...req.body, createdBy: req.user.id };
        const lot = await ExternalLot.create(lotData);
        res.status(201).json({ success: true, data: lot });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar lote externo
// @route   PUT /api/pcp/external-lots/:id
export const updateExternalLot = async (req, res, next) => {
    try {
        const allowedFields = ['origin', 'producerName', 'cattleCount', 'arrivalDate', 'notes', 'type'];
        const updateData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

        const lot = await ExternalLot.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, data: lot });
    } catch (error) {
        next(error);
    }
};

// @desc    Excluir lote externo
// @route   DELETE /api/pcp/external-lots/:id
export const deleteExternalLot = async (req, res, next) => {
    try {
        await ExternalLot.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Lote externo excluído' });
    } catch (error) {
        next(error);
    }
};
