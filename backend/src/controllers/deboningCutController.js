import DeboningCut from '../models/DeboningCut.js';
import fs from 'fs';

// @desc    Obter catálogo de cortes
// @route   GET /api/deboning/cuts
export const getCuts = async (req, res, next) => {
    try {
        const { broker } = req.query;
        const query = { active: true };
        if (broker) query.broker = broker;

        const cuts = await DeboningCut.find(query).populate('broker', 'name').sort('name');
        res.json({ success: true, data: cuts });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo tipo de corte (com imagem)
// @route   POST /api/deboning/cuts
export const createCut = async (req, res, next) => {
    try {
        const cutData = { ...req.body, createdBy: req.user.id };
        
        if (req.file) {
            cutData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const cut = await DeboningCut.create(cutData);
        res.status(201).json({ success: true, data: cut });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar tipo de corte
// @route   PUT /api/deboning/cuts/:id
export const updateCut = async (req, res, next) => {
    try {
        const cutData = { ...req.body };
        
        if (req.file) {
            // Remover imagem antiga se existir
            const oldCut = await DeboningCut.findById(req.params.id);
            if (oldCut && oldCut.imageUrl) {
                const oldPath = `./${oldCut.imageUrl}`;
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            cutData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const cut = await DeboningCut.findByIdAndUpdate(req.params.id, cutData, {
            new: true,
            runValidators: true
        });
        res.json({ success: true, data: cut });
    } catch (error) {
        next(error);
    }
};

// @desc    Remover corte
// @route   DELETE /api/deboning/cuts/:id
export const deleteCut = async (req, res, next) => {
    try {
        const cut = await DeboningCut.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        res.json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
