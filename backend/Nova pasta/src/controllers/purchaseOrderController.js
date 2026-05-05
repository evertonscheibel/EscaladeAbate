import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import Quote from '../models/Quote.js';
import Asset from '../models/Asset.js';
import AssetTimeline from '../models/AssetTimeline.js';
import Budget from '../models/Budget.js';
import Notification from '../models/Notification.js';

// @desc    Obter todos os pedidos de compra
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = async (req, res) => {
    try {
        const { status, supplier, startDate, endDate } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const orders = await PurchaseOrder.find(filter)
            .populate('purchaseRequest', 'requestNumber title department')
            .populate('supplier', 'name tradeName contact')
            .populate('quote')
            .populate('receivedItems.receivedBy', 'name')
            .populate('receivedItems.asset')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos',
            error: error.message
        });
    }
};

// @desc    Obter um pedido específico
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrder = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id)
            .populate('purchaseRequest')
            .populate('supplier')
            .populate('quote')
            .populate('receivedItems.receivedBy', 'name email')
            .populate('receivedItems.asset');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedido',
            error: error.message
        });
    }
};

// @desc    Criar pedido de compra
// @route   POST /api/purchase-orders
// @access  Private
export const createPurchaseOrder = async (req, res) => {
    try {
        const { purchaseRequestId } = req.body;

        const request = await PurchaseRequest.findById(purchaseRequestId)
            .populate('selectedQuote');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        if (request.status !== 'aprovado') {
            return res.status(400).json({
                success: false,
                message: 'Solicitação não está aprovada'
            });
        }

        if (!request.selectedQuote) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma cotação selecionada'
            });
        }

        const quote = request.selectedQuote;

        // Criar pedido
        const orderData = {
            purchaseRequest: request._id,
            quote: quote._id,
            supplier: quote.supplier,
            items: quote.items,
            totalValue: quote.totalValue,
            deliveryAddress: req.body.deliveryAddress,
            expectedDeliveryDate: req.body.expectedDeliveryDate,
            notes: req.body.notes
        };

        const order = await PurchaseOrder.create(orderData);

        // Atualizar solicitação
        request.purchaseOrder = order._id;
        await request.save();

        // Criar notificação para o solicitante
        await Notification.create({
            user: request.requester,
            title: 'Pedido de compra emitido',
            message: `Pedido ${order.orderNumber} foi emitido para sua solicitação ${request.requestNumber}`,
            type: 'success',
            link: `/purchase-orders/${order._id}`
        });

        res.status(201).json({
            success: true,
            message: 'Pedido criado com sucesso',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao criar pedido',
            error: error.message
        });
    }
};

// @desc    Atualizar pedido
// @route   PUT /api/purchase-orders/:id
// @access  Private
export const updatePurchaseOrder = async (req, res) => {
    try {
        const order = await PurchaseOrder.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Pedido atualizado com sucesso',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar pedido',
            error: error.message
        });
    }
};

// @desc    Cancelar pedido
// @route   POST /api/purchase-orders/:id/cancel
// @access  Private (admin)
export const cancelPurchaseOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await PurchaseOrder.findById(req.params.id)
            .populate('purchaseRequest');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (['recebido_total', 'cancelado'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar este pedido'
            });
        }

        order.status = 'cancelado';
        order.notes = (order.notes || '') + `\nCancelado: ${reason}`;
        await order.save();

        // Liberar orçamento se ainda não foi gasto
        const request = order.purchaseRequest;
        if (request.budgetImpact.allocated > 0 && request.budgetImpact.spent === 0) {
            const budget = await Budget.findOne({
                department: request.department,
                year: new Date().getFullYear(),
                category: request.category
            });

            if (budget) {
                await budget.release(
                    request.budgetImpact.allocated,
                    { model: 'PurchaseOrder', id: order._id },
                    `Liberação por cancelamento do pedido ${order.orderNumber}`
                );
            }
        }

        res.json({
            success: true,
            message: 'Pedido cancelado com sucesso',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar pedido',
            error: error.message
        });
    }
};

// @desc    Registrar recebimento de itens
// @route   POST /api/purchase-orders/:id/receive
// @access  Private
export const receiveItems = async (req, res) => {
    try {
        const { items, createAssets } = req.body;
        // items: [{ itemIndex, quantityReceived, condition, notes, assetData }]

        const order = await PurchaseOrder.findById(req.params.id)
            .populate('purchaseRequest')
            .populate('supplier');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        const createdAssets = [];

        for (const item of items) {
            const receivedItem = {
                itemIndex: item.itemIndex,
                description: order.items[item.itemIndex].description,
                quantityReceived: item.quantityReceived,
                condition: item.condition,
                notes: item.notes,
                receivedBy: req.user._id
            };

            // Criar ativo se solicitado e item conforme
            if (createAssets && item.condition === 'conforme' && item.assetData) {
                const assetData = {
                    ...item.assetData,
                    purchaseOrder: order._id,
                    purchaseRequest: order.purchaseRequest._id,
                    supplier: order.supplier._id,
                    purchaseValue: order.items[item.itemIndex].unitPrice,
                    acquisitionDate: new Date(),
                    purchaseDate: new Date(),
                    status: 'disponivel'
                };

                const asset = await Asset.create(assetData);
                receivedItem.asset = asset._id;
                createdAssets.push(asset);

                // Criar evento no timeline do ativo
                await AssetTimeline.create({
                    asset: asset._id,
                    eventType: 'purchase_received',
                    description: `Ativo recebido do pedido ${order.orderNumber}`,
                    performedBy: req.user._id,
                    metadata: {
                        purchaseOrder: order._id,
                        supplier: order.supplier.name,
                        value: order.items[item.itemIndex].unitPrice
                    }
                });
            }

            order.receivedItems.push(receivedItem);
        }

        await order.save();

        // Atualizar orçamento (mover de alocado para gasto)
        if (order.status === 'recebido_total') {
            const request = order.purchaseRequest;
            const budget = await Budget.findOne({
                department: request.department,
                year: new Date().getFullYear(),
                category: request.category
            });

            if (budget && request.budgetImpact.allocated > 0) {
                await budget.spend(
                    request.budgetImpact.allocated,
                    { model: 'PurchaseOrder', id: order._id },
                    `Gasto do pedido ${order.orderNumber}`
                );

                request.budgetImpact.spent = request.budgetImpact.allocated;
                request.budgetImpact.allocated = 0;
                request.status = 'concluido';
                await request.save();
            }
        }

        res.json({
            success: true,
            message: 'Recebimento registrado com sucesso',
            data: {
                order,
                createdAssets
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar recebimento',
            error: error.message
        });
    }
};

// @desc    Obter estatísticas de pedidos
// @route   GET /api/purchase-orders/stats
// @access  Private
export const getOrderStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const stats = await PurchaseOrder.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            }
        ]);

        const bySupplier = await PurchaseOrder.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$supplier',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'supplier'
                }
            },
            { $unwind: '$supplier' },
            { $sort: { totalValue: -1 } },
            { $limit: 10 }
        ]);

        const total = await PurchaseOrder.countDocuments(filter);
        const totalValue = await PurchaseOrder.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);

        res.json({
            success: true,
            data: {
                byStatus: stats,
                bySupplier,
                total,
                totalValue: totalValue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
};
