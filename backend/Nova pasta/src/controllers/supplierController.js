import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

// @desc    Obter todos os fornecedores
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = async (req, res) => {
    try {
        const { status, category, search } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (category) filter.categories = category;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tradeName: { $regex: search, $options: 'i' } },
                { cnpj: { $regex: search, $options: 'i' } }
            ];
        }

        const suppliers = await Supplier.find(filter).sort({ rating: -1, name: 1 });

        res.json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar fornecedores',
            error: error.message
        });
    }
};

// @desc    Obter um fornecedor específico
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar fornecedor',
            error: error.message
        });
    }
};

// @desc    Criar novo fornecedor
// @route   POST /api/suppliers
// @access  Private (admin, tecnico)
export const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Fornecedor criado com sucesso',
            data: supplier
        });
    } catch (error) {
        // Verificar erro de CNPJ duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'CNPJ já cadastrado'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Erro ao criar fornecedor',
            error: error.message
        });
    }
};

// @desc    Atualizar fornecedor
// @route   PUT /api/suppliers/:id
// @access  Private (admin, tecnico)
export const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Fornecedor atualizado com sucesso',
            data: supplier
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar fornecedor',
            error: error.message
        });
    }
};

// @desc    Excluir fornecedor
// @route   DELETE /api/suppliers/:id
// @access  Private (admin)
export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        // Verificar se tem pedidos associados
        const ordersCount = await PurchaseOrder.countDocuments({ supplier: req.params.id });

        if (ordersCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir fornecedor com pedidos associados. Considere inativá-lo.'
            });
        }

        await supplier.deleteOne();

        res.json({
            success: true,
            message: 'Fornecedor excluído com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir fornecedor',
            error: error.message
        });
    }
};

// @desc    Obter performance de um fornecedor
// @route   GET /api/suppliers/:id/performance
// @access  Private
export const getSupplierPerformance = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        // Buscar pedidos do fornecedor
        const orders = await PurchaseOrder.find({ supplier: req.params.id })
            .sort({ createdAt: -1 });

        // Calcular métricas
        const totalOrders = orders.length;
        let onTimeDeliveries = 0;
        let totalDeliveries = 0;
        let totalResponseTime = 0;

        orders.forEach(order => {
            if (order.actualDeliveryDate) {
                totalDeliveries++;
                if (order.actualDeliveryDate <= order.expectedDeliveryDate) {
                    onTimeDeliveries++;
                }
            }

            // Calcular tempo de resposta (diferença entre criação e confirmação)
            if (order.status !== 'emitido') {
                const responseTime = (order.updatedAt - order.createdAt) / (1000 * 60 * 60); // em horas
                totalResponseTime += responseTime;
            }
        });

        const onTimePercentage = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
        const avgResponseTime = totalOrders > 0 ? totalResponseTime / totalOrders : 0;

        // Atualizar performance do fornecedor
        supplier.performance.totalOrders = totalOrders;
        supplier.performance.onTimeDelivery = Math.round(onTimePercentage);
        supplier.performance.averageResponseTime = Math.round(avgResponseTime);
        await supplier.save();

        res.json({
            success: true,
            data: {
                supplier: supplier.name,
                performance: supplier.performance,
                rating: supplier.rating,
                recentOrders: orders.slice(0, 10)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar performance',
            error: error.message
        });
    }
};

// @desc    Atualizar avaliação do fornecedor
// @route   PUT /api/suppliers/:id/rating
// @access  Private
export const updateSupplierRating = async (req, res) => {
    try {
        const { rating } = req.body;

        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Avaliação deve estar entre 0 e 5'
            });
        }

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        supplier.rating = rating;
        await supplier.save();

        res.json({
            success: true,
            message: 'Avaliação atualizada com sucesso',
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar avaliação',
            error: error.message
        });
    }
};
