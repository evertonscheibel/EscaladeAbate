import Rancher from '../models/Rancher.js';

// @desc    Buscar pecuaristas (com autocomplete)
// @route   GET /api/ranchers/search?q=nome
export const searchRanchers = async (req, res, next) => {
    try {
        const { q } = req.query;

        const query = q
            ? {
                name: { $regex: q, $options: 'i' },
                active: true
            }
            : { active: true };

        const ranchers = await Rancher.find(query)
            .select('name cpfCnpj phone')
            .limit(20)
            .sort('name');

        res.json({
            success: true,
            data: ranchers
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar pecuarista
// @route   POST /api/ranchers
export const createRancher = async (req, res, next) => {
    try {
        const rancher = await Rancher.create({
            ...req.body,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: rancher
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Listar todos pecuaristas
// @route   GET /api/ranchers
export const getRanchers = async (req, res, next) => {
    try {
        const ranchers = await Rancher.find({ active: true })
            .populate('createdBy', 'name')
            .sort('-createdAt');

        res.json({
            success: true,
            data: ranchers
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar pecuarista
// @route   PUT /api/ranchers/:id
export const updateRancher = async (req, res, next) => {
    try {
        const rancher = await Rancher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!rancher) {
            return res.status(404).json({
                success: false,
                message: 'Pecuarista não encontrado'
            });
        }

        res.json({
            success: true,
            data: rancher
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Desativar pecuarista
// @route   DELETE /api/ranchers/:id
export const deleteRancher = async (req, res, next) => {
    try {
        const rancher = await Rancher.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { new: true }
        );

        if (!rancher) {
            return res.status(404).json({
                success: false,
                message: 'Pecuarista não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Pecuarista desativado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};
