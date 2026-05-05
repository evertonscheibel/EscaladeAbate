import api from './api';

export interface Ticket {
    _id: string;
    title: string;
    description: string;
    category: string;
    priority: 'baixa' | 'media' | 'alta' | 'critica';
    status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
    requester: any;
    assignedTo?: any[];
    sector?: string;
    asset?: any;
    comments: any[];
    attachments: any[];
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    isPublic?: boolean;
    assignedBy?: any;
    supportLevel?: 'N1' | 'N2' | 'N3';
    assignedAt?: string;
    acceptedAt?: string;
    firstResponseAt?: string;
    closedAt?: string;
}

export const ticketService = {
    async getAll(params?: any) {
        const response = await api.get('/tickets', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/tickets/${id}`);
        return response.data;
    },

    async create(data: Partial<Ticket>) {
        const response = await api.post('/tickets', data);
        return response.data;
    },

    async update(id: string, data: Partial<Ticket>) {
        const response = await api.put(`/tickets/${id}`, data);
        return response.data;
    },

    async addComment(id: string, comment: string) {
        const response = await api.post(`/tickets/${id}/comments`, { comment });
        return response.data;
    },

    async getStats() {
        const response = await api.get('/tickets/stats/summary');
        return response.data;
    },

    // Métodos de Workflow (ITSM)
    async assign(id: string, assignedToId: string, supportLevel?: string) {
        const response = await api.post(`/tickets/${id}/assign`, { assignedToId, supportLevel });
        return response.data;
    },

    async accept(id: string) {
        const response = await api.post(`/tickets/${id}/accept`);
        return response.data;
    },

    async start(id: string) {
        const response = await api.post(`/tickets/${id}/start`);
        return response.data;
    },

    async pending(id: string, type: 'pendente_cliente' | 'pendente_interno', reason: string) {
        const response = await api.post(`/tickets/${id}/pending`, { type, reason });
        return response.data;
    },

    async resolve(id: string, resolutionNote: string) {
        const response = await api.post(`/tickets/${id}/resolve`, { resolutionNote });
        return response.data;
    },

    async close(id: string) {
        const response = await api.post(`/tickets/${id}/close`);
        return response.data;
    },

    async reopen(id: string, reason: string) {
        const response = await api.post(`/tickets/${id}/reopen`, { reason });
        return response.data;
    },

    async getNextTicket() {
        const response = await api.post('/tickets/queue/next');
        return response.data;
    },

    async getAgentMetrics() {
        const response = await api.get('/tickets/metrics/agents');
        return response.data;
    },

    async getAgentReport(startDate?: string, endDate?: string) {
        const response = await api.get('/tickets/reports/agents', { params: { startDate, endDate } });
        return response.data;
    },

    async exportAgentReport(startDate?: string, endDate?: string) {
        const response = await api.get('/tickets/reports/agents/export', {
            params: { startDate, endDate },
            responseType: 'blob' // Importante para download de arquivo
        });
        return response;
    },

    async getAgentActivityReport(startDate?: string, endDate?: string) {
        const response = await api.get('/tickets/reports/agents/activity', { params: { startDate, endDate } });
        return response.data;
    },

    async getEvents(id: string) {
        const response = await api.get(`/tickets/${id}/events`);
        return response.data;
    }
};
