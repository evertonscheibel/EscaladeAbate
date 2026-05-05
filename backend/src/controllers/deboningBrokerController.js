import DeboningBroker from '../models/DeboningBroker.js';

// @desc    Obter todos os corretores de desossa
// @route   GET /api/deboning/brokers
export const getBrokers = async (req, res, next) => {
    try {
        const brokers = await DeboningBroker.find({ active: true }).sort('name');
        res.json({ success: true, data: brokers });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter corretor por ID
// @route   GET /api/deboning/brokers/:id
export const getBroker = async (req, res, next) => {
    try {
        const broker = await DeboningBroker.findById(req.params.id);
        if (!broker) return res.status(404).json({ success: false, message: 'Corretor não encontrado' });
        res.json({ success: true, data: broker });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo corretor
// @route   POST /api/deboning/brokers
export const createBroker = async (req, res, next) => {
    try {
        const broker = await DeboningBroker.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, data: broker });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar corretor
// @route   PUT /api/deboning/brokers/:id
export const updateBroker = async (req, res, next) => {
    try {
        const broker = await DeboningBroker.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.json({ success: true, data: broker });
    } catch (error) {
        next(error);
    }
};

// @desc    Remover (desativar) corretor
// @route   DELETE /api/deboning/brokers/:id
export const deleteBroker = async (req, res, next) => {
    try {
        const broker = await DeboningBroker.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        res.json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
