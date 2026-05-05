import ColdRoom from '../models/ColdRoom.js';

export const getColdRooms = async (req, res) => {
    try {
        const rooms = await ColdRoom.find().sort({ nome: 1 });
        res.json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createColdRoom = async (req, res) => {
    try {
        const room = await ColdRoom.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, data: room });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Câmara com este nome já existe.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateColdRoom = async (req, res) => {
    try {
        const room = await ColdRoom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!room) return res.status(404).json({ success: false, message: 'Câmara não encontrada.' });
        res.json({ success: true, data: room });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteColdRoom = async (req, res) => {
    try {
        const room = await ColdRoom.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: 'Câmara não encontrada.' });
        res.json({ success: true, message: 'Câmara removida.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addReading = async (req, res) => {
    try {
        const room = await ColdRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: 'Câmara não encontrada.' });

        const { temperatura, ocupacaoAtualKg } = req.body;
        room.temperaturaAtual = temperatura;
        if (ocupacaoAtualKg !== undefined) room.ocupacaoAtualKg = ocupacaoAtualKg;

        room.leituras.push({
            temperatura,
            registradoPor: req.user._id
        });

        // Manter apenas últimas 100 leituras
        if (room.leituras.length > 100) {
            room.leituras = room.leituras.slice(-100);
        }

        await room.save();
        res.json({ success: true, data: room });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
