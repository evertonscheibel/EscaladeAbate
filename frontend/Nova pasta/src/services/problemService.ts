import api from './api';

export const problemService = {
    async getAll(params?: any) {
        const response = await api.get('/problems', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/problems/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/problems', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/problems/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/problems/${id}`);
        return response.data;
    },

    async linkIncident(problemId: string, ticketId: string) {
        const response = await api.post(`/problems/${problemId}/incidents/${ticketId}`);
        return response.data;
    },

    async unlinkIncident(problemId: string, ticketId: string) {
        const response = await api.delete(`/problems/${problemId}/incidents/${ticketId}`);
        return response.data;
    },

    async getStats() {
        const response = await api.get('/problems/stats/analytics');
        return response.data;
    }
};

export default problemService;
