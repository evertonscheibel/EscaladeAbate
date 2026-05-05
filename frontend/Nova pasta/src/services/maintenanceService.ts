import api from './api';

export const maintenanceService = {
    async getAll(params?: any) {
        const response = await api.get('/maintenances', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/maintenances/${id}`);
        return response.data;
    },

    async getByAsset(assetId: string) {
        const response = await api.get(`/maintenances/asset/${assetId}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/maintenances', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/maintenances/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/maintenances/${id}`);
        return response.data;
    },

    async getStats(params?: any) {
        const response = await api.get('/maintenances/stats/analytics', { params });
        return response.data;
    },

    async getReport(period = '30') {
        const response = await api.get('/maintenances/reports/analytics', {
            params: { period }
        });
        return response.data;
    }
};

export default maintenanceService;
