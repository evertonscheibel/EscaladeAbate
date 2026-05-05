import Ticket from '../models/Ticket.js';
import TicketEvent from '../models/TicketEvent.js';

// Utilitário para registrar evento
const logEvent = async (ticketId, type, userId, data = {}, session = null) => {
    const event = new TicketEvent({
        ticketId,
        type,
        byUserId: userId,
        data,
        ...data // data pode conter visibility
    });
    // Se houver sessão (transação), usa.
    if (session) {
        await event.save({ session });
    } else {
        await event.save();
    }
};

export const assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedToId, supportLevel } = req.body;
        const managerId = req.user._id;

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        const previousAssignee = ticket.assignedTo;

        ticket.assignedTo = assignedToId;
        ticket.assignedBy = managerId;
        ticket.assignedAt = new Date();
        if (supportLevel) ticket.supportLevel = supportLevel;

        // Se atribuído, status pode mudar para aberto (se estava novo) ou manter
        // Não mudamos status para em_andamento automaticamente na atribuição, apenas notificamos

        await ticket.save();

        await logEvent(id, 'ASSIGNED', managerId, {
            fromAssignee: previousAssignee,
            toAssignee: assignedToId,
            level: supportLevel
        });

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atribuir ticket', error: error.message });
    }
};

export const acceptTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user._id;

        // Atomic update para evitar corrida
        // Condição: Ticket deve estar sem dono OU atribuído ao próprio agente (confirmação)
        const ticket = await Ticket.findOne({ _id: id });

        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        if (ticket.assignedTo && ticket.assignedTo.toString() !== agentId.toString()) {
            return res.status(400).json({ message: 'Ticket já atribuído a outro usuário' });
        }

        ticket.assignedTo = agentId;
        ticket.acceptedAt = new Date();

        // Se ainda não teve resposta, marca sla de response se quiser (ou no start)

        await ticket.save();
        await logEvent(id, 'ACCEPTED', agentId);

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao aceitar ticket', error: error.message });
    }
};

export const startTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user._id;

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        if (ticket.assignedTo && ticket.assignedTo.toString() !== agentId.toString()) {
            return res.status(403).json({ message: 'Você não é o responsável por este ticket' });
        }

        ticket.status = 'em_andamento';
        // Se não tiver acceptedAt, define agora
        if (!ticket.acceptedAt) ticket.acceptedAt = new Date();

        await ticket.save();
        await logEvent(id, 'WORK_STARTED', agentId, {
            fromStatus: ticket.status,
            toStatus: 'em_andamento'
        });

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao iniciar ticket', error: error.message });
    }
};

export const pendingTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, reason } = req.body; // type: 'pendente_cliente' ou 'pendente_interno'
        const agentId = req.user._id;

        if (!['pendente_cliente', 'pendente_interno'].includes(type)) {
            return res.status(400).json({ message: 'Tipo de pendência inválido' });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        const oldStatus = ticket.status;
        ticket.status = type;

        await ticket.save();
        await logEvent(id, type === 'pendente_cliente' ? 'PENDING_CUSTOMER' : 'PENDING_INTERNAL', agentId, {
            fromStatus: oldStatus,
            toStatus: type,
            reason
        });

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao pendenciar ticket', error: error.message });
    }
};

export const resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionNote } = req.body;
        const agentId = req.user._id;

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        ticket.status = 'resolvido';
        ticket.resolvedAt = new Date();

        await ticket.save();
        await logEvent(id, 'RESOLVED', agentId, {
            resolutionNote,
            visibility: 'PUBLIC'
        });

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao resolver ticket', error: error.message });
    }
};

export const closeTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id; // Pode ser gestor ou o próprio usuário confirmando

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        ticket.status = 'fechado';
        ticket.closedAt = new Date();

        await ticket.save();
        await logEvent(id, 'CLOSED', userId);

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao fechar ticket', error: error.message });
    }
};

export const reopenTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

        const oldStatus = ticket.status;
        ticket.status = 'aberto';
        ticket.resolvedAt = undefined;
        ticket.closedAt = undefined;
        // Mantém assignedTo ou limpa? Geralmente mantém ou limpa dependendo da regra. Vamos manter.

        await ticket.save();
        await logEvent(id, 'REOPENED', userId, {
            fromStatus: oldStatus,
            toStatus: 'aberto',
            reason
        });

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao reabrir ticket', error: error.message });
    }
};

export const getNextTicket = async (req, res) => {
    try {
        const agentId = req.user._id;
        // Pega filtro opcional (ex: prioridade, categoria)
        // Regra simples: Ticket Aberto, Sem Dono, Ordenado por Prioridade (Critica > Alta) e Data (Antigo > Novo)

        const priorityOrder = { 'critica': 1, 'alta': 2, 'media': 3, 'baixa': 4 };

        // Buscar candidato
        // Nota: Mongoose não ordena por mapa customizado facilmente no findOne, então fazemos sort composto se possível.
        // Vamos buscar os abertos sem assignedTo.

        const tickets = await Ticket.find({
            status: 'aberto',
            assignedTo: { $exists: false }
        }).limit(50); // Pega um lote para ordenar em memória se banco for pequeno, ou user aggregation

        // Melhor usar aggregation para ordenar corretamente por prioridade customizada
        const nextTicket = await Ticket.aggregate([
            { $match: { status: 'aberto', assignedTo: null } },
            {
                $addFields: {
                    priorityValue: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$priority", "critica"] }, then: 1 },
                                { case: { $eq: ["$priority", "alta"] }, then: 2 },
                                { case: { $eq: ["$priority", "media"] }, then: 3 },
                                { case: { $eq: ["$priority", "baixa"] }, then: 4 }
                            ],
                            default: 5
                        }
                    }
                }
            },
            { $sort: { priorityValue: 1, createdAt: 1 } },
            { $limit: 1 }
        ]);

        if (!nextTicket || nextTicket.length === 0) {
            return res.status(404).json({ message: 'Não há tickets disponíveis na fila.' });
        }

        const ticketId = nextTicket[0]._id;

        // Tentar atribuir atomicamente
        const updatedTicket = await Ticket.findOneAndUpdate(
            { _id: ticketId, assignedTo: null }, // Garante que ainda está livre
            {
                assignedTo: agentId,
                assignedAt: new Date(),
                acceptedAt: new Date() // Já considera aceito ao puxar
            },
            { new: true }
        );

        if (!updatedTicket) {
            // Concorrência: alguém pegou antes
            return res.status(409).json({ message: 'Ticket foi pego por outro agente, tente novamente.' });
        }

        await logEvent(updatedTicket._id, 'ASSIGNED', agentId, { method: 'PULL' }); // Self-assigned
        await logEvent(updatedTicket._id, 'ACCEPTED', agentId);

        res.status(200).json(updatedTicket);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar próximo ticket', error: error.message });
    }
};

// Obter métricas do agente
// Obter métricas do agente
export const getAgentMetrics = async (req, res) => {
    try {
        const agentId = req.user._id;

        // Contar tickets disponíveis na fila (aberto e sem dono)
        const availableInQueue = await Ticket.countDocuments({
            status: 'aberto',
            $or: [
                { assignedTo: { $exists: false } },
                { assignedTo: { $size: 0 } },
                { assignedTo: null }
            ]
        });

        const stats = await Ticket.aggregate([
            // assignedTo é um array, então usamos $in para verificar se o agentId está no array
            { $match: { assignedTo: { $in: [agentId] } } },
            {
                $group: {
                    _id: null,
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
                    }
                }
            },
            {
                $project: {
                    totalTickets: 1,
                    resolvedTickets: 1,
                    openTickets: 1,
                    slaBreachedTickets: 1,
                    avgResolutionTimeHours: { $cond: [{ $eq: ["$avgResolutionTime", null] }, 0, { $divide: ["$avgResolutionTime", 3600000] }] },
                    avgFirstResponseTimeHours: { $cond: [{ $eq: ["$avgFirstResponseTime", null] }, 0, { $divide: ["$avgFirstResponseTime", 3600000] }] }
                }
            }
        ]);

        const finalStats = stats[0] || {
            totalTickets: 0,
            resolvedTickets: 0,
            openTickets: 0,
            slaBreachedTickets: 0,
            avgResolutionTimeHours: 0,
            avgFirstResponseTimeHours: 0
        };

        res.json({
            ...finalStats,
            availableInQueue
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar métricas', error: error.message });
    }
}

export const getTicketEvents = async (req, res) => {
    try {
        const { id } = req.params;
        const events = await TicketEvent.find({ ticketId: id })
            .sort({ at: 1 })
            .populate('byUserId', 'name role');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar eventos', error: error.message });
    }
};
