import Ticket from '../models/Ticket.js';
import * as XLSX from 'xlsx';
import { sendTicketAutoReply } from '../utils/emailService.js';

// @desc    Listar todos os tickets
// @route   GET /api/tickets
// @access  Private
export const getTickets = async (req, res, next) => {
    try {
        const { status, priority, category, assignedTo } = req.query;

        let query = {};

        // Filtros
        // Filtros
        if (status) {
            if (status.includes(',')) {
                query.status = { $in: status.split(',') };
            } else {
                query.status = status;
            }
        }
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (assignedTo) {
            if (assignedTo === 'unassigned') {
                query.$or = [
                    { assignedTo: { $exists: true, $size: 0 } },
                    { assignedTo: { $exists: false } },
                    { assignedTo: null }
                ];
            } else {
                query.assignedTo = { $in: [assignedTo] };
            }
        }

        // Se for cliente, mostrar apenas seus tickets
        if (req.user.role === 'cliente') {
            query.requester = req.user.id;
        }

        // Se for técnico e forneceu um filtro de atribuição, aplicar. Caso contrário, vê tudo (visibilidade estendida)
        if (req.user.role === 'tecnico' && assignedTo) {
            query.assignedTo = { $in: [assignedTo] };
        }

        const tickets = await Ticket.find(query)
            .populate('requester', 'name email')
            .populate('assignedTo', 'name email')
            .populate('asset', 'assetId description')
            .populate('comments.user', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter ticket por ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('requester', 'name email')
            .populate('assignedTo', 'name email')
            .populate('asset', 'assetId description location')
            .populate('comments.user', 'name email');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket não encontrado'
            });
        }

        // Verificar permissão
        if (req.user.role === 'cliente' && ticket.requester._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = async (req, res, next) => {
    try {
        const ticketData = {
            ...req.body,
            requester: req.user.id
        };

        // Validar assignedTo se for enviado
        if (ticketData.assignedTo) {
            if (Array.isArray(ticketData.assignedTo)) {
                // Filtrar IDs inválidos
                ticketData.assignedTo = ticketData.assignedTo.filter(id => typeof id === 'string' && id.length === 24);
                if (ticketData.assignedTo.length === 0) delete ticketData.assignedTo;
            } else if (typeof ticketData.assignedTo === 'string' && ticketData.assignedTo.length === 24) {
                // Converter para array se for string única
                ticketData.assignedTo = [ticketData.assignedTo];
            } else {
                delete ticketData.assignedTo;
            }
        }

        // Se o usuário for técnico, atribuir automaticamente a ele (adicionar ao array ou criar novo)
        if (req.user.role === 'tecnico') {
            ticketData.assignedTo = [req.user.id];
            ticketData.assignedBy = req.user.id;
            ticketData.assignedAt = new Date();
            ticketData.status = 'em_andamento';
        }

        const ticket = await Ticket.create(ticketData);

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('requester', 'name email')
            .populate('assignedTo', 'name email');

        // Enviar e-mail de confirmação (Auto-Resposta)
        sendTicketAutoReply(populatedTicket).catch(err => console.error('Erro no disparo de e-mail:', err));

        res.status(201).json({
            success: true,
            data: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar ticket
// @route   PUT /api/tickets/:id
// @access  Private (Admin/Tecnico)
export const updateTicket = async (req, res, next) => {
    try {
        let ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket não encontrado'
            });
        }

        // Se status mudou para resolvido, adicionar data
        if (req.body.status === 'resolvido' && ticket.status !== 'resolvido') {
            req.body.resolvedAt = new Date();
        }

        ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('requester', 'name email')
            .populate('assignedTo', 'name email')
            .populate('asset', 'assetId description');

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin)
export const deleteTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket não encontrado'
            });
        }

        await ticket.deleteOne();

        res.json({
            success: true,
            message: 'Ticket deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Adicionar comentário ao ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket não encontrado'
            });
        }

        ticket.comments.push({
            user: req.user.id,
            comment: req.body.comment
        });

        await ticket.save();

        const updatedTicket = await Ticket.findById(ticket._id)
            .populate('comments.user', 'name email');

        res.status(201).json({
            success: true,
            data: updatedTicket
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Estatísticas de tickets
// @route   GET /api/tickets/stats/summary
// @access  Private (Admin/Tecnico)
export const getTicketStats = async (req, res, next) => {
    try {
        const stats = await Ticket.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byPriority: [
                        { $group: { _id: '$priority', count: { $sum: 1 } } }
                    ],
                    byCategory: [
                        { $group: { _id: '$category', count: { $sum: 1 } } }
                    ],
                    avgResolutionTime: [
                        {
                            $match: { resolvedAt: { $exists: true } }
                        },
                        {
                            $project: {
                                resolutionTime: {
                                    $subtract: ['$resolvedAt', '$createdAt']
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgTime: { $avg: '$resolutionTime' }
                            }
                        }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar ticket público (sem autenticação)
// @route   POST /api/tickets/public
// @access  Public
export const createPublicTicket = async (req, res, next) => {
    try {
        const { contactName, contactEmail, contactPhone, title, description, category } = req.body;

        // Validar campos obrigatórios
        if (!contactName || !contactEmail || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email, assunto e descrição são obrigatórios'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        const ticketData = {
            title,
            description,
            category: category || 'suporte',
            contactName,
            contactEmail,
            contactPhone,
            isPublic: true,
            status: 'aberto',
            priority: 'media'
        };

        const ticket = await Ticket.create(ticketData);

        // Enviar e-mail de confirmação (Auto-Resposta)
        sendTicketAutoReply(ticket).catch(err => console.error('Erro no disparo de e-mail:', err));

        res.status(201).json({
            success: true,
            message: 'Chamado registrado com sucesso! Entraremos em contato em breve.',
            data: {
                ticketNumber: ticket.ticketNumber,
                title: ticket.title,
                status: ticket.status
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Relatório de desempenho dos atendentes
// @route   GET /api/tickets/reports/agents
// @access  Private (Admin/Tecnico)
export const getAgentReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let dateMatch = {};
        if (startDate && endDate) {
            dateMatch = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const stats = await Ticket.aggregate([
            { $match: dateMatch },
            { $unwind: '$assignedTo' },
            {
                $group: {
                    _id: "$assignedTo",
                    totalTickets: { $sum: 1 },
                    resolvedTickets: {
                        $sum: { $cond: [{ $in: ["$status", ["resolvido", "fechado"]] }, 1, 0] }
                    },
                    openTickets: {
                        $sum: { $cond: [{ $in: ["$status", ["aberto", "em_andamento", "pendente_cliente", "pendente_interno"]] }, 1, 0] }
                    },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ne: ["$resolvedAt", null] }, { $ne: ["$createdAt", null] }] },
                                { $subtract: ["$resolvedAt", "$createdAt"] },
                                null
                            ]
                        }
                    },
                    avgFirstResponseTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ne: ["$firstResponseAt", null] }, { $ne: ["$createdAt", null] }] },
                                { $subtract: ["$firstResponseAt", "$createdAt"] },
                                null
                            ]
                        }
                    },
                    slaBreachedTickets: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $and: [{ $eq: ["$priority", "critica"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 14400000] }] }, // 4h
                                        { $and: [{ $eq: ["$priority", "alta"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 28800000] }] }, // 8h
                                        { $and: [{ $eq: ["$priority", "media"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 86400000] }] }, // 24h
                                        { $and: [{ $eq: ["$priority", "baixa"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 172800000] }] } // 48h
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    criticalTickets: { $sum: { $cond: [{ $eq: ["$priority", "critica"] }, 1, 0] } },
                    highTickets: { $sum: { $cond: [{ $eq: ["$priority", "alta"] }, 1, 0] } },
                    mediumTickets: { $sum: { $cond: [{ $eq: ["$priority", "media"] }, 1, 0] } },
                    lowTickets: { $sum: { $cond: [{ $eq: ["$priority", "baixa"] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "agentInfo"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$agentInfo.name", 0] },
                    email: { $arrayElemAt: ["$agentInfo.email", 0] },
                    totalTickets: 1,
                    resolvedTickets: 1,
                    openTickets: 1,
                    slaBreachedTickets: 1,
                    criticalTickets: 1,
                    highTickets: 1,
                    mediumTickets: 1,
                    lowTickets: 1,
                    avgResolutionTimeHours: { $cond: [{ $eq: ["$avgResolutionTime", null] }, 0, { $divide: ["$avgResolutionTime", 3600000] }] },
                    avgFirstResponseTimeHours: { $cond: [{ $eq: ["$avgFirstResponseTime", null] }, 0, { $divide: ["$avgFirstResponseTime", 3600000] }] }
                }
            },
            { $match: { name: { $exists: true } } } // Filtrar tickets não atribuídos ou user deletado
        ]);

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

// @desc    Exportar relatório de atendentes para Excel
// @route   GET /api/tickets/reports/agents/export
// @access  Private (Admin/Tecnico)
export const exportAgentReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let dateMatch = {};
        if (startDate && endDate) {
            dateMatch = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const stats = await Ticket.aggregate([
            { $match: dateMatch },
            { $unwind: '$assignedTo' },
            {
                $group: {
                    _id: "$assignedTo",
                    totalTickets: { $sum: 1 },
                    resolvedTickets: {
                        $sum: { $cond: [{ $in: ["$status", ["resolvido", "fechado"]] }, 1, 0] }
                    },
                    openTickets: {
                        $sum: { $cond: [{ $in: ["$status", ["aberto", "em_andamento", "pendente_cliente", "pendente_interno"]] }, 1, 0] }
                    },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ne: ["$resolvedAt", null] }, { $ne: ["$createdAt", null] }] },
                                { $subtract: ["$resolvedAt", "$createdAt"] },
                                null
                            ]
                        }
                    },
                    avgFirstResponseTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ne: ["$firstResponseAt", null] }, { $ne: ["$createdAt", null] }] },
                                { $subtract: ["$firstResponseAt", "$createdAt"] },
                                null
                            ]
                        }
                    },
                    slaBreachedTickets: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $and: [{ $eq: ["$priority", "critica"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 14400000] }] },
                                        { $and: [{ $eq: ["$priority", "alta"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 28800000] }] },
                                        { $and: [{ $eq: ["$priority", "media"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 86400000] }] },
                                        { $and: [{ $eq: ["$priority", "baixa"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 172800000] }] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    criticalTickets: { $sum: { $cond: [{ $eq: ["$priority", "critica"] }, 1, 0] } },
                    highTickets: { $sum: { $cond: [{ $eq: ["$priority", "alta"] }, 1, 0] } },
                    mediumTickets: { $sum: { $cond: [{ $eq: ["$priority", "media"] }, 1, 0] } },
                    lowTickets: { $sum: { $cond: [{ $eq: ["$priority", "baixa"] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "agentInfo"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$agentInfo.name", 0] },
                    email: { $arrayElemAt: ["$agentInfo.email", 0] },
                    totalTickets: 1,
                    resolvedTickets: 1,
                    openTickets: 1,
                    slaBreachedTickets: 1,
                    avgResolutionTimeHours: { $cond: [{ $eq: ["$avgResolutionTime", null] }, 0, { $divide: ["$avgResolutionTime", 3600000] }] },
                    avgFirstResponseTimeHours: { $cond: [{ $eq: ["$avgFirstResponseTime", null] }, 0, { $divide: ["$avgFirstResponseTime", 3600000] }] }
                }
            },
            { $match: { name: { $exists: true } } }
        ]);

        const data = stats.map(agent => ({
            'Atendente': agent.name,
            'Email': agent.email,
            'Total Tickets': agent.totalTickets,
            'Críticos': agent.criticalTickets,
            'Alta': agent.highTickets,
            'Média': agent.mediumTickets,
            'Baixa': agent.lowTickets,
            'Resolvidos': agent.resolvedTickets,
            'Em Aberto/Andamento': agent.openTickets,
            'Violações de SLA': agent.slaBreachedTickets,
            'Tempo Médio Resolução (h)': agent.avgResolutionTimeHours ? agent.avgResolutionTimeHours.toFixed(2) : 'N/A',
            'Tempo Médio 1ª Resposta (h)': agent.avgFirstResponseTimeHours ? agent.avgFirstResponseTimeHours.toFixed(2) : 'N/A'
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Atendentes');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_atendentes.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        next(error);
    }
};

// @desc    Relatório ANALÍTICO de atendentes
// @route   GET /api/tickets/reports/agents/activity
// @access  Private (Admin/Tecnico)
export const getAgentActivityReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let dateMatch = {};
        if (startDate && endDate) {
            dateMatch = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Buscar tickets com populate necessário
        const tickets = await Ticket.find(dateMatch)
            .populate('assignedTo', 'name email') // Array of users
            .populate('requester', 'name email sector')
            .sort({ createdAt: -1 });

        // Agrupar por atendente (como assignedTo é array, um ticket pode aparecer para múltiplos atendentes)
        const agentActivities = {};

        tickets.forEach(ticket => {
            // Garantir que assignedTo seja tratado como array, mesmo se vazio ou null
            const assignedList = Array.isArray(ticket.assignedTo) ? ticket.assignedTo : [];

            assignedList.forEach(agent => {
                // Se agent for null/undefined (ex: usuário deletado), ignorar
                if (!agent || !agent._id) return;

                const agentId = agent._id.toString();
                if (!agentActivities[agentId]) {
                    agentActivities[agentId] = {
                        agentName: agent.name,
                        agentEmail: agent.email,
                        tickets: []
                    };
                }
                agentActivities[agentId].tickets.push(ticket);
            });
        });

        // Converter objeto para array
        const reportData = Object.values(agentActivities);

        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        next(error);
    }
};
