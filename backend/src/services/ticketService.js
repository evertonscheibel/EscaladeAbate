import Ticket from '../models/Ticket.js';
import { paginate } from '../utils/paginationHelper.js';
import { logAudit } from '../middleware/auditMiddleware.js';

class TicketService {
    async listTickets(query, paginationOptions) {
        return await paginate(Ticket, query, paginationOptions);
    }

    async getTicketById(id, populateOptions = []) {
        const ticket = await Ticket.findById(id).populate(populateOptions);
        if (!ticket) throw new Error('Ticket não encontrado');
        return ticket;
    }

    async createTicket(data, user) {
        const ticketData = { ...data, requester: user?._id || user };
        return await Ticket.create(ticketData);
    }

    async updateTicket(id, data, user, req) {
        const ticket = await Ticket.findById(id);
        if (!ticket) throw new Error('Ticket não encontrado');

        // Whitelist de campos permitidos (Mass Assignment Protection)
        const allowedFields = [
            'title', 'description', 'category', 'sector', 'priority',
            'status', 'assignedTo', 'assignedBy', 'assignedAt',
            'acceptedAt', 'supportLevel', 'firstResponseAt',
            'closedAt', 'asset', 'purchaseRequest'
        ];

        const updateData = {};
        allowedFields.forEach(f => {
            if (data[f] !== undefined) updateData[f] = data[f];
        });

        // Lógica de negócio: resolver ticket
        if (updateData.status === 'resolvido' && ticket.status !== 'resolvido') {
            updateData.resolvedAt = new Date();
        }

        const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).populate('requester', 'name email')
            .populate('assignedTo', 'name email')
            .populate('asset', 'assetId description');

        return updatedTicket;
    }

    async addComment(id, comment, user) {
        const ticket = await Ticket.findById(id);
        if (!ticket) throw new Error('Ticket não encontrado');

        ticket.comments.push({
            user: user._id || user,
            comment
        });

        await ticket.save();

        return await Ticket.findById(id)
            .populate('comments.user', 'name email');
    }

    async deleteTicket(id, user, req) {
        const ticket = await Ticket.findById(id);
        if (!ticket) throw new Error('Ticket não encontrado');

        await ticket.softDelete(user._id);

        // Log de auditoria
        await logAudit({
            user,
            action: 'DELETE',
            resource: 'TICKET',
            resourceId: id,
            severity: 'medium',
            details: `Ticket "${ticket.title}" excluído (Soft Delete) por ${user.name}`,
            req
        });

        return true;
    }
}

export default new TicketService();
