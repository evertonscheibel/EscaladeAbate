import ProductionArea from '../models/ProductionArea.js';
import { paginate } from '../utils/paginationHelper.js';

/**
 * GET /api/production-areas
 */
export const getProductionAreas = async (req, res, next) => {
    try {
        const { search, sector, active } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { codigo: { $regex: search, $options: 'i' } },
                { nome: { $regex: search, $options: 'i' } }
            ];
        }

        if (sector) filter.setor = sector;
        if (active !== undefined) filter.active = active === 'true';

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort || 'codigo',
            populate: [{ path: 'responsavel', select: 'name' }]
        };

        const result = await paginate(ProductionArea, filter, options);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/production-areas
 */
export const createProductionArea = async (req, res, next) => {
    try {
        const area = await ProductionArea.create(req.body);
        res.status(201).json({ success: true, data: area });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/production-areas/:id
 */
export const getProductionAreaById = async (req, res, next) => {
    try {
        const area = await ProductionArea.findById(req.params.id)
            .populate('responsavel', 'name');

        if (!area) {
            return res.status(404).json({ success: false, message: 'Área não encontrada' });
        }
        res.json({ success: true, data: area });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/production-areas/:id
 */
export const updateProductionArea = async (req, res, next) => {
    try {
        const area = await ProductionArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!area) {
            return res.status(404).json({ success: false, message: 'Área não encontrada' });
        }
        res.json({ success: true, data: area });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/production-areas/:id
 */
export const deleteProductionArea = async (req, res, next) => {
    try {
        const area = await ProductionArea.findById(req.params.id);
        if (!area) {
            return res.status(404).json({ success: false, message: 'Área não encontrada' });
        }
        await area.softDelete(req.user._id);
        res.json({ success: true, message: 'Área removida' });
    } catch (error) {
        next(error);
    }
};
