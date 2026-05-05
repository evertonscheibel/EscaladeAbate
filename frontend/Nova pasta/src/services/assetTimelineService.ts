import api from './api';

export const assetTimelineService = {
    async getByAsset(assetId: string, params?: any) {
        const response = await api.get(`/timeline/asset/${assetId}`, { params });
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/timeline', data);
        return response.data;
    },

    async getStats(assetId: string) {
        const response = await api.get(`/timeline/stats/${assetId}`);
        return response.data;
    },

    async getGovernanceReport(params?: any) {
        const response = await api.get('/timeline/reports/governance', { params });
        return response.data;
    }
};

export default assetTimelineService;
