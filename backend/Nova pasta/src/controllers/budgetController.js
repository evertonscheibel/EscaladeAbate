import Budget from '../models/Budget.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

// @desc    Obter todos os orçamentos
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
    try {
        const { department, year, category } = req.query;

        const filter = {};

        if (department) filter.department = department;
        if (year) filter.year = parseInt(year);
        if (category) filter.category = category;

        const budgets = await Budget.find(filter).sort({ department: 1, category: 1 });

        res.json({
            success: true,
            count: budgets.length,
            data: budgets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar orçamentos',
            error: error.message
        });
    }
};

// @desc    Obter um orçamento específico
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Orçamento não encontrado'
            });
        }

        res.json({
            success: true,
            data: budget
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar orçamento',
            error: error.message
        });
    }
};

// @desc    Criar orçamento
// @route   POST /api/budgets
// @access  Private (admin)
export const createBudget = async (req, res) => {
    try {
        const budget = await Budget.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Orçamento criado com sucesso',
            data: budget
        });
    } catch (error) {
        // Verificar erro de duplicação
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Já existe orçamento para este departamento/ano/categoria'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Erro ao criar orçamento',
            error: error.message
        });
    }
};

// @desc    Atualizar orçamento
// @route   PUT /api/budgets/:id
// @access  Private (admin)
export const updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Orçamento não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Orçamento atualizado com sucesso',
            data: budget
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar orçamento',
            error: error.message
        });
    }
};

// @desc    Verificar disponibilidade orçamentária
// @route   GET /api/budgets/check
// @access  Private
export const checkAvailability = async (req, res) => {
    try {
        const { department, category, amount } = req.query;

        if (!department || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Departamento e valor são obrigatórios'
            });
        }

        const year = new Date().getFullYear();
        const requestedAmount = parseFloat(amount);

        const budget = await Budget.findOne({
            department,
            year,
            category: category || 'geral'
        });

        if (!budget) {
            return res.json({
                success: false,
                available: false,
                message: 'Orçamento não configurado para este departamento/categoria',
                data: null
            });
        }

        const isAvailable = budget.available >= requestedAmount;
        const utilizationPercentage = ((budget.allocated + budget.spent) / budget.totalBudget) * 100;

        res.json({
            success: true,
            available: isAvailable,
            data: {
                budget: {
                    total: budget.totalBudget,
                    allocated: budget.allocated,
                    spent: budget.spent,
                    available: budget.available
                },
                requestedAmount,
                remainingAfter: budget.available - requestedAmount,
                utilizationPercentage: Math.round(utilizationPercentage),
                warnings: []
            }
        });

        // Adicionar avisos
        if (!isAvailable) {
            res.json({
                ...res.json(),
                data: {
                    ...res.json().data,
                    warnings: ['Orçamento insuficiente']
                }
            });
        } else if (utilizationPercentage > 90) {
            res.json({
                ...res.json(),
                data: {
                    ...res.json().data,
                    warnings: ['Orçamento próximo do limite (>90%)']
                }
            });
        } else if (utilizationPercentage > 75) {
            res.json({
                ...res.json(),
                data: {
                    ...res.json().data,
                    warnings: ['Orçamento em alerta (>75%)']
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar disponibilidade',
            error: error.message
        });
    }
};

// @desc    Obter relatório de execução orçamentária
// @route   GET /api/budgets/report
// @access  Private
export const getBudgetReport = async (req, res) => {
    try {
        const { year, department } = req.query;
        const reportYear = year ? parseInt(year) : new Date().getFullYear();

        const filter = { year: reportYear };
        if (department) filter.department = department;

        const budgets = await Budget.find(filter);

        // Buscar solicitações e pedidos do período
        const requests = await PurchaseRequest.find({
            createdAt: {
                $gte: new Date(reportYear, 0, 1),
                $lte: new Date(reportYear, 11, 31)
            },
            ...(department && { department })
        });

        const orders = await PurchaseOrder.find({
            createdAt: {
                $gte: new Date(reportYear, 0, 1),
                $lte: new Date(reportYear, 11, 31)
            }
        }).populate('purchaseRequest', 'department');

        // Calcular métricas por departamento
        const byDepartment = budgets.map(budget => {
            const deptRequests = requests.filter(r => r.department === budget.department);
            const deptOrders = orders.filter(o => o.purchaseRequest?.department === budget.department);

            return {
                department: budget.department,
                category: budget.category,
                budget: {
                    total: budget.totalBudget,
                    allocated: budget.allocated,
                    spent: budget.spent,
                    available: budget.available
                },
                utilization: {
                    percentage: Math.round(((budget.allocated + budget.spent) / budget.totalBudget) * 100),
                    allocated: Math.round((budget.allocated / budget.totalBudget) * 100),
                    spent: Math.round((budget.spent / budget.totalBudget) * 100)
                },
                requests: {
                    total: deptRequests.length,
                    approved: deptRequests.filter(r => r.status === 'aprovado').length,
                    rejected: deptRequests.filter(r => r.status === 'rejeitado').length,
                    pending: deptRequests.filter(r => r.status === 'aguardando_aprovacao').length
                },
                orders: {
                    total: deptOrders.length,
                    completed: deptOrders.filter(o => o.status === 'recebido_total').length,
                    pending: deptOrders.filter(o => !['recebido_total', 'cancelado'].includes(o.status)).length
                }
            };
        });

        // Totais gerais
        const totals = {
            budget: budgets.reduce((sum, b) => sum + b.totalBudget, 0),
            allocated: budgets.reduce((sum, b) => sum + b.allocated, 0),
            spent: budgets.reduce((sum, b) => sum + b.spent, 0),
            available: budgets.reduce((sum, b) => sum + b.available, 0)
        };

        res.json({
            success: true,
            data: {
                year: reportYear,
                totals,
                byDepartment,
                summary: {
                    totalRequests: requests.length,
                    totalOrders: orders.length,
                    averageUtilization: Math.round((totals.allocated + totals.spent) / totals.budget * 100)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar relatório',
            error: error.message
        });
    }
};
