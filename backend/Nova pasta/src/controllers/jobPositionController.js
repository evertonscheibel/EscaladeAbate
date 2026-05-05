import JobPosition from '../models/JobPosition.js';

export const getOpenPositions = async (req, res) => {
    try {
        const positions = await JobPosition.find({ status: 'EM_ABERTO' })
            .sort({ titulo_vaga: 1 });
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllPositions = async (req, res) => {
    try {
        const positions = await JobPosition.find().sort({ createdAt: -1 });
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPositionById = async (req, res) => {
    try {
        const position = await JobPosition.findById(req.params.id);
        if (!position) {
            return res.status(404).json({ message: 'Vaga não encontrada' });
        }
        res.json(position);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
