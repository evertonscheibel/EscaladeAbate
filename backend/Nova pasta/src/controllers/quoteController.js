import Quote from '../models/Quote.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import Supplier from '../models/Supplier.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Obter todas as cotações
// @route   GET /api/quotes
// @access  Private
export const getQuotes = async (req, res) => {
    try {
        const { status, purchaseRequest, supplier } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (purchaseRequest) filter.purchaseRequest = purchaseRequest;
        if (supplier) filter.supplier = supplier;

        const quotes = await Quote.find(filter)
            .populate('purchaseRequest', 'requestNumber title')
            .populate('supplier', 'name tradeName rating')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: quotes.length,
            data: quotes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cotações',
            error: error.message
        });
    }
};

// @desc    Obter uma cotação específica
// @route   GET /api/quotes/:id
// @access  Private
export const getQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id)
            .populate('purchaseRequest')
            .populate('supplier')
            .populate('createdBy', 'name email');

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Cotação não encontrada'
            });
        }

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cotação',
            error: error.message
        });
    }
};

// @desc    Criar nova cotação
// @route   POST /api/quotes
// @access  Private
export const createQuote = async (req, res) => {
    try {
        const quoteData = {
            ...req.body,
            createdBy: req.user._id
        };

        // Verificar se a solicitação existe e está em status adequado
        const request = await PurchaseRequest.findById(req.body.purchaseRequest);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação de compra não encontrada'
            });
        }

        if (!['aguardando_cotacao', 'em_cotacao'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Solicitação não está aguardando cotação'
            });
        }

        const quote = await Quote.create(quoteData);

        // Atualizar status da solicitação
        if (request.status === 'aguardando_cotacao') {
            request.status = 'em_cotacao';
        }

        // Adicionar cotação à lista da solicitação
        request.quotes.push(quote._id);
        await request.save();

        res.status(201).json({
            success: true,
            message: 'Cotação criada com sucesso',
            data: quote
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao criar cotação',
            error: error.message
        });
    }
};

// @desc    Atualizar cotação
// @route   PUT /api/quotes/:id
// @access  Private
export const updateQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Cotação não encontrada'
            });
        }

        // Não pode editar cotação aceita
        if (quote.status === 'aceita') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível editar cotação aceita'
            });
        }

        const updatedQuote = await Quote.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Cotação atualizada com sucesso',
            data: updatedQuote
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar cotação',
            error: error.message
        });
    }
};

// @desc    Excluir cotação
// @route   DELETE /api/quotes/:id
// @access  Private
export const deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Cotação não encontrada'
            });
        }

        // Não pode excluir cotação aceita
        if (quote.status === 'aceita') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir cotação aceita'
            });
        }

        // Remover da lista da solicitação
        await PurchaseRequest.findByIdAndUpdate(
            quote.purchaseRequest,
            { $pull: { quotes: quote._id } }
        );

        await quote.deleteOne();

        res.json({
            success: true,
            message: 'Cotação excluída com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir cotação',
            error: error.message
        });
    }
};

// @desc    Selecionar cotação vencedora
// @route   POST /api/quotes/:id/select
// @access  Private (admin, tecnico)
export const selectQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id)
            .populate('purchaseRequest')
            .populate('supplier');

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Cotação não encontrada'
            });
        }

        const request = quote.purchaseRequest;

        if (request.status !== 'em_cotacao') {
            return res.status(400).json({
                success: false,
                message: 'Solicitação não está em cotação'
            });
        }

        // Marcar cotação como aceita
        quote.status = 'aceita';
        await quote.save();

        // Rejeitar outras cotações
        await Quote.updateMany(
            {
                purchaseRequest: request._id,
                _id: { $ne: quote._id },
                status: { $in: ['pendente', 'enviada'] }
            },
            { status: 'rejeitada' }
        );

        // Atualizar solicitação
        request.selectedQuote = quote._id;
        request.status = 'aguardando_aprovacao';

        // Criar workflow de aprovação baseado no valor
        const approvalWorkflow = [];

        // Buscar gestor do departamento (simplificado - assumindo que existe um usuário com role 'gestor')
        const gestor = await User.findOne({ role: 'gestor', department: request.department });

        if (gestor) {
            approvalWorkflow.push({
                approver: gestor._id,
                level: 'gestor',
                status: 'pendente'
            });

            // Criar notificação para o gestor
            await Notification.create({
                user: gestor._id,
                title: 'Nova solicitação para aprovação',
                message: `Solicitação ${request.requestNumber} aguarda sua aprovação (R$ ${quote.totalValue.toFixed(2)})`,
                type: 'warning',
                link: `/purchase-requests/${request._id}`
            });
        }

        // Se valor acima de R$ 5.000, adicionar aprovação de diretor
        if (quote.totalValue > 5000) {
            const diretor = await User.findOne({ role: 'admin' }); // Simplificado

            if (diretor) {
                approvalWorkflow.push({
                    approver: diretor._id,
                    level: 'diretor',
                    status: 'pendente'
                });

                // Criar notificação para o diretor
                await Notification.create({
                    user: diretor._id,
                    title: 'Nova solicitação para aprovação',
                    message: `Solicitação ${request.requestNumber} requer aprovação de diretor (R$ ${quote.totalValue.toFixed(2)})`,
                    type: 'warning',
                    link: `/purchase-requests/${request._id}`
                });
            }
        }

        request.approvalWorkflow = approvalWorkflow;
        await request.save();

        res.json({
            success: true,
            message: 'Cotação selecionada com sucesso. Solicitação enviada para aprovação.',
            data: { quote, request }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao selecionar cotação',
            error: error.message
        });
    }
};

// @desc    Comparar cotações de uma solicitação
// @route   GET /api/quotes/request/:requestId/compare
// @access  Private
export const compareQuotes = async (req, res) => {
    try {
        const quotes = await Quote.find({
            purchaseRequest: req.params.requestId,
            status: { $in: ['pendente', 'enviada', 'aceita'] }
        })
            .populate('supplier', 'name tradeName rating performance')
            .sort({ totalValue: 1 }); // Ordenar por menor preço

        if (quotes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhuma cotação encontrada para esta solicitação'
            });
        }

        // Análise comparativa
        const comparison = {
            quotes,
            analysis: {
                lowestPrice: quotes[0],
                highestPrice: quotes[quotes.length - 1],
                averagePrice: quotes.reduce((sum, q) => sum + q.totalValue, 0) / quotes.length,
                bestDeliveryTime: quotes.reduce((best, q) => {
                    const maxDelivery = Math.max(...q.items.map(i => i.deliveryTime));
                    const bestMaxDelivery = Math.max(...best.items.map(i => i.deliveryTime));
                    return maxDelivery < bestMaxDelivery ? q : best;
                }),
                bestRatedSupplier: quotes.reduce((best, q) =>
                    q.supplier.rating > (best.supplier?.rating || 0) ? q : best
                    , {})
            }
        };

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao comparar cotações',
            error: error.message
        });
    }
};
