import ChecklistModel from '../models/ChecklistModel.js';
import { paginate } from '../utils/paginationHelper.js';

/**
 * GET /api/checklist-models
 */
export const getChecklistModels = async (req, res, next) => {
    try {
        const { search, program, area, status } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { codigo: { $regex: search, $options: 'i' } },
                { titulo: { $regex: search, $options: 'i' } }
            ];
        }

        if (program) filter.programa = program;
        if (area) filter.area = area;
        if (status) filter.status = status;

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort || '-createdAt',
            populate: [
                { path: 'programa', select: 'codigo nome' },
                { path: 'area', select: 'codigo nome' },
                { path: 'aprovado_por', select: 'name' }
            ]
        };

        const result = await paginate(ChecklistModel, filter, options);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/checklist-models
 */
export const createChecklistModel = async (req, res, next) => {
    try {
        // Versionamento simplificado: Se já existe código ativo, inativar antes? 
        // Ou apenas criar nova versão manual. Regra: Se editar modelo ativo, vira nova versão.
        const model = await ChecklistModel.create({
            ...req.body,
            aprovado_por: req.user._id
        });
        res.status(201).json({ success: true, data: model });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/checklist-models/:id
 */
export const getChecklistModelById = async (req, res, next) => {
    try {
        const model = await ChecklistModel.findById(req.params.id)
            .populate('programa', 'codigo nome')
            .populate('area', 'codigo nome')
            .populate('aprovado_por', 'name');

        if (!model) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado' });
        }
        res.json({ success: true, data: model });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/checklist-models/:id
 */
export const updateChecklistModel = async (req, res, next) => {
    try {
        const model = await ChecklistModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!model) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado' });
        }
        res.json({ success: true, data: model });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/checklist-models/:id/duplicate
 */
export const duplicateChecklistModel = async (req, res, next) => {
    try {
        const original = await ChecklistModel.findById(req.params.id).lean();
        if (!original) return res.status(404).json({ success: false, message: 'Original não encontrado' });

        delete original._id;
        delete original.createdAt;
        delete original.updatedAt;
        original.codigo = `${original.codigo}-COPY`;
        original.titulo = `${original.titulo} (Cópia)`;
        original.status = 'Em revisão';

        const copy = await ChecklistModel.create(original);
        res.status(201).json({ success: true, data: copy });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/checklist-models/:id
 */
export const deleteChecklistModel = async (req, res, next) => {
    try {
        const model = await ChecklistModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado' });
        }
        await model.softDelete(req.user._id);
        res.json({ success: true, message: 'Modelo removido' });
    } catch (error) {
        next(error);
    }
};
