import PurchaseRequest from '../models/PurchaseRequest.js';
import Budget from '../models/Budget.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Obter todas as solicitações de compra
// @route   GET /api/purchase-requests
// @access  Private
export const getPurchaseRequests = async (req, res) => {
    try {
        const { status, department, startDate, endDate, urgency } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (department) filter.department = department;
        if (urgency) filter.urgency = urgency;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const requests = await PurchaseRequest.find(filter)
            .populate('requester', 'name email')
            .populate('approvalWorkflow.approver', 'name email')
            .populate('selectedQuote')
            .populate('purchaseOrder')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar solicitações',
            error: error.message
        });
    }
};

// @desc    Obter uma solicitação específica
// @route   GET /api/purchase-requests/:id
// @access  Private
export const getPurchaseRequest = async (req, res) => {
    try {
        const request = await PurchaseRequest.findById(req.params.id)
            .populate('requester', 'name email department')
            .populate('approvalWorkflow.approver', 'name email role')
            .populate({
                path: 'quotes',
                populate: { path: 'supplier', select: 'name tradeName' }
            })
            .populate('selectedQuote')
            .populate('purchaseOrder');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar solicitação',
            error: error.message
        });
    }
};

// @desc    Criar nova solicitação de compra
// @route   POST /api/purchase-requests
// @access  Private
export const createPurchaseRequest = async (req, res) => {
    try {
        const requestData = {
            ...req.body,
            requester: req.user._id
        };

        console.log('Dados recebidos para criar solicitação:', requestData);

        const request = await PurchaseRequest.create(requestData);

        res.status(201).json({
            success: true,
            message: 'Solicitação criada com sucesso',
            data: request
        });
    } catch (error) {
        console.error('Erro ao criar solicitação:', error);

        // Tratar erros de validação do Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                error: messages.join(', ')
            });
        }

        // Tratar erro de chave duplicada
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Solicitação duplicada',
                error: 'Já existe uma solicitação com este número'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Erro ao criar solicitação',
            error: error.message
        });
    }
};

// @desc    Atualizar solicitação de compra
// @route   PUT /api/purchase-requests/:id
// @access  Private
export const updatePurchaseRequest = async (req, res) => {
    try {
        const request = await PurchaseRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        // Apenas rascunhos podem ser editados
        if (request.status !== 'rascunho') {
            return res.status(400).json({
                success: false,
                message: 'Apenas solicitações em rascunho podem ser editadas'
            });
        }

        // Verificar se é o solicitante
        if (request.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para editar esta solicitação'
            });
        }

        const updatedRequest = await PurchaseRequest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Solicitação atualizada com sucesso',
            data: updatedRequest
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar solicitação',
            error: error.message
        });
    }
};

// @desc    Excluir solicitação de compra
// @route   DELETE /api/purchase-requests/:id
// @access  Private
export const deletePurchaseRequest = async (req, res) => {
    try {
        const request = await PurchaseRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        // Apenas rascunhos podem ser excluídos
        if (request.status !== 'rascunho') {
            return res.status(400).json({
                success: false,
                message: 'Apenas solicitações em rascunho podem ser excluídas'
            });
        }

        // Verificar permissão
        if (request.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para excluir esta solicitação'
            });
        }

        await request.deleteOne();

        res.json({
            success: true,
            message: 'Solicitação excluída com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir solicitação',
            error: error.message
        });
    }
};

// @desc    Submeter solicitação para cotação
// @route   POST /api/purchase-requests/:id/submit
// @access  Private
export const submitForQuotation = async (req, res) => {
    try {
        const request = await PurchaseRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        if (request.status !== 'rascunho') {
            return res.status(400).json({
                success: false,
                message: 'Apenas solicitações em rascunho podem ser submetidas'
            });
        }

        // Verificar orçamento disponível
        const budget = await Budget.findOne({
            department: request.department,
            year: new Date().getFullYear(),
            category: request.category
        });

        if (!budget) {
            return res.status(400).json({
                success: false,
                message: 'Orçamento não configurado para este departamento/categoria'
            });
        }

        if (budget.available < request.totalValue) {
            return res.status(400).json({
                success: false,
                message: `Orçamento insuficiente. Disponível: R$ ${budget.available.toFixed(2)}, Solicitado: R$ ${request.totalValue.toFixed(2)}`
            });
        }

        // Alocar orçamento
        await budget.allocate(
            request.totalValue,
            { model: 'PurchaseRequest', id: request._id },
            `Alocação para solicitação ${request.requestNumber}`
        );

        request.status = 'aguardando_cotacao';
        request.budgetImpact.allocated = request.totalValue;
        await request.save();

        res.json({
            success: true,
            message: 'Solicitação submetida para cotação',
            data: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao submeter solicitação',
            error: error.message
        });
    }
};

// @desc    Adicionar aprovação/rejeição
// @route   POST /api/purchase-requests/:id/approve
// @access  Private
export const addApproval = async (req, res) => {
    try {
        const { action, comments } = req.body; // action: 'aprovar' ou 'rejeitar'
        const request = await PurchaseRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        if (request.status !== 'aguardando_aprovacao') {
            return res.status(400).json({
                success: false,
                message: 'Solicitação não está aguardando aprovação'
            });
        }

        // Encontrar aprovação pendente do usuário atual
        const pendingApproval = request.approvalWorkflow.find(
            approval => approval.approver.toString() === req.user._id.toString() &&
                approval.status === 'pendente'
        );

        if (!pendingApproval) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem aprovação pendente para esta solicitação'
            });
        }

        // Atualizar aprovação
        pendingApproval.status = action === 'aprovar' ? 'aprovado' : 'rejeitado';
        pendingApproval.comments = comments;
        pendingApproval.date = new Date();

        // Se rejeitado, atualizar status da solicitação e liberar orçamento
        if (action === 'rejeitar') {
            request.status = 'rejeitado';
            request.rejectionReason = comments;

            // Liberar orçamento
            const budget = await Budget.findOne({
                department: request.department,
                year: new Date().getFullYear(),
                category: request.category
            });

            if (budget && request.budgetImpact.allocated > 0) {
                await budget.release(
                    request.budgetImpact.allocated,
                    { model: 'PurchaseRequest', id: request._id },
                    `Liberação por rejeição da solicitação ${request.requestNumber}`
                );
                request.budgetImpact.allocated = 0;
            }
        } else {
            // Verificar se todas as aprovações foram concedidas
            const allApproved = request.approvalWorkflow.every(
                approval => approval.status === 'aprovado'
            );

            if (allApproved) {
                request.status = 'aprovado';
            }
        }

        await request.save();

        // Criar notificação para o solicitante
        await Notification.create({
            user: request.requester,
            title: `Solicitação ${action === 'aprovar' ? 'aprovada' : 'rejeitada'}`,
            message: `Sua solicitação ${request.requestNumber} foi ${action === 'aprovar' ? 'aprovada' : 'rejeitada'} por ${req.user.name}`,
            type: 'info',
            link: `/purchase-requests/${request._id}`
        });

        res.json({
            success: true,
            message: `Solicitação ${action === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso`,
            data: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar aprovação',
            error: error.message
        });
    }
};

// @desc    Cancelar solicitação
// @route   POST /api/purchase-requests/:id/cancel
// @access  Private
export const cancelRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await PurchaseRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        // Não pode cancelar se já concluída
        if (request.status === 'concluido') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar solicitação concluída'
            });
        }

        // Liberar orçamento se alocado
        if (request.budgetImpact.allocated > 0) {
            const budget = await Budget.findOne({
                department: request.department,
                year: new Date().getFullYear(),
                category: request.category
            });

            if (budget) {
                await budget.release(
                    request.budgetImpact.allocated,
                    { model: 'PurchaseRequest', id: request._id },
                    `Liberação por cancelamento da solicitação ${request.requestNumber}`
                );
            }
        }

        request.status = 'cancelado';
        request.cancelReason = reason;
        await request.save();

        res.json({
            success: true,
            message: 'Solicitação cancelada com sucesso',
            data: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar solicitação',
            error: error.message
        });
    }
};

// @desc    Obter estatísticas de solicitações
// @route   GET /api/purchase-requests/stats
// @access  Private
export const getRequestStats = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (department) filter.department = department;

        const stats = await PurchaseRequest.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            }
        ]);

        const byDepartment = await PurchaseRequest.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            }
        ]);

        const total = await PurchaseRequest.countDocuments(filter);
        const totalValue = await PurchaseRequest.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);

        res.json({
            success: true,
            data: {
                byStatus: stats,
                byDepartment,
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

// @desc    Criar ativo a partir de solicitação de compra
// @route   POST /api/purchase-requests/:id/create-asset
// @access  Private (Admin)
export const createAssetFromRequest = async (req, res) => {
    try {
        const request = await PurchaseRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        if (request.status !== 'concluido') {
            return res.status(400).json({
                success: false,
                message: 'Apenas solicitações concluídas podem gerar ativos'
            });
        }

        // Importar modelo Asset
        const Asset = (await import('../models/Asset.js')).default;

        // Gerar ID do ativo automaticamente
        const assetCount = await Asset.countDocuments();
        const assetId = `ASSET-${new Date().getFullYear()}-${String(assetCount + 1).padStart(5, '0')}`;

        // Criar ativo com dados da solicitação
        const assetData = {
            assetId,
            description: req.body.description || request.title,
            type: req.body.type || 'outro',
            brand: req.body.brand || '',
            model: req.body.model || '',
            serialNumber: req.body.serialNumber || '',
            location: req.body.location || '',
            acquisitionDate: new Date(),
            purchaseDate: new Date(),
            purchaseValue: request.totalValue,
            warrantyExpiration: req.body.warrantyExpiration || null,
            status: 'ativo',
            responsible: req.user._id,
            assignedTo: req.body.assignedTo || null,
            department: request.department,
            notes: req.body.notes || `Criado a partir da solicitação ${request.requestNumber}`,
            purchaseRequest: request._id,
            purchaseOrder: request.purchaseOrder || null
        };

        const asset = await Asset.create(assetData);

        // Criar entrada na timeline do ativo
        const AssetTimeline = (await import('../models/AssetTimeline.js')).default;
        await AssetTimeline.create({
            asset: asset._id,
            eventType: 'aquisicao',
            description: `Ativo adquirido através da solicitação de compra ${request.requestNumber}`,
            performedBy: req.user._id,
            metadata: {
                purchaseRequest: request._id,
                purchaseValue: request.totalValue
            }
        });

        res.status(201).json({
            success: true,
            message: 'Ativo criado com sucesso',
            data: asset
        });
    } catch (error) {
        console.error('Erro ao criar ativo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar ativo',
            error: error.message
        });
    }
};
