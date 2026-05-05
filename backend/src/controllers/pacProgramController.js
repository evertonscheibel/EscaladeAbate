import PacProgram from '../models/PacProgram.js';
import { paginate } from '../utils/paginationHelper.js';

/**
 * GET /api/pac-programs
 */
export const getPacPrograms = async (req, res, next) => {
    try {
        const { search, active } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { codigo: { $regex: search, $options: 'i' } },
                { nome: { $regex: search, $options: 'i' } }
            ];
        }

        if (active !== undefined) filter.active = active === 'true';

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort || 'codigo',
            populate: [{ path: 'responsavel_tecnico', select: 'name' }]
        };

        const result = await paginate(PacProgram, filter, options);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/pac-programs
 */
export const createPacProgram = async (req, res, next) => {
    try {
        const program = await PacProgram.create(req.body);
        res.status(201).json({ success: true, data: program });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/pac-programs/:id
 */
export const getPacProgramById = async (req, res, next) => {
    try {
        const program = await PacProgram.findById(req.params.id)
            .populate('responsavel_tecnico', 'name');

        if (!program) {
            return res.status(404).json({ success: false, message: 'Programa não encontrado' });
        }
        res.json({ success: true, data: program });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/pac-programs/:id
 */
export const updatePacProgram = async (req, res, next) => {
    try {
        const program = await PacProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!program) {
            return res.status(404).json({ success: false, message: 'Programa não encontrado' });
        }
        res.json({ success: true, data: program });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/pac-programs/:id
 */
export const deletePacProgram = async (req, res, next) => {
    try {
        const program = await PacProgram.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ success: false, message: 'Programa não encontrado' });
        }
        await program.softDelete(req.user._id);
        res.json({ success: true, message: 'Programa removido' });
    } catch (error) {
        next(error);
    }
};
