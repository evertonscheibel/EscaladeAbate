import api from './api';

export const credentialService = {
    // Listagem e busca
    async getAll(params?: any) {
        const response = await api.get('/credentials', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/credentials/${id}`);
        return response.data;
    },

    async getStats() {
        const response = await api.get('/credentials/stats');
        return response.data;
    },

    async getAccessLog(id: string) {
        const response = await api.get(`/credentials/${id}/access-log`);
        return response.data;
    },

    // CRUD
    async create(data: any) {
        const response = await api.post('/credentials', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/credentials/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/credentials/${id}`);
        return response.data;
    },

    // Copiar senha (registra no log)
    async copyPassword(id: string) {
        const response = await api.post(`/credentials/${id}/copy`);
        return response.data;
    }
};

export default credentialService;
