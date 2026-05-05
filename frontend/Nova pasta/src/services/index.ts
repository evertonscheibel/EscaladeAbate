import api from './api';

export const dashboardService = {
    async getKPIs() {
        const response = await api.get('/dashboard/kpis');
        return response.data;
    },

    async getRecentActivity(limit = 10) {
        const response = await api.get('/dashboard/recent-activity', {
            params: { limit }
        });
        return response.data;
    },

    async getOperational() {
        const response = await api.get('/dashboard/operational');
        return response.data;
    },

    async getAlerts() {
        const response = await api.get('/dashboard/alerts');
        return response.data;
    }
};

export const assetService = {
    async getAll(params?: any) {
        const response = await api.get('/assets', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/assets/${id}`);
        return response.data;
    },

    async getWithDetails(id: string) {
        const response = await api.get(`/assets/${id}/details`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/assets', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/assets/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/assets/${id}`);
        return response.data;
    },

    async getReport() {
        const response = await api.get('/assets/reports/analytics');
        return response.data;
    },

    async importAssets(formData: FormData) {
        const response = await api.post('/assets/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async exportAssets() {
        const response = await api.get('/assets/export', {
            responseType: 'blob'
        });
        return response.data;
    }
};

export const certificateService = {
    async getAll(params?: any) {
        const response = await api.get('/certificates', { params });
        return response.data;
    },

    async getExpiring(days = 30) {
        const response = await api.get('/certificates/expiring/soon', {
            params: { days }
        });
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/certificates', data, {
            headers: {
                'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/certificates/${id}`, data, {
            headers: {
                'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/certificates/${id}`);
        return response.data;
    }
};

export const kbService = {
    async getAll(params?: any) {
        const response = await api.get('/kb', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/kb/${id}`);
        return response.data;
    },

    async search(query: string) {
        const response = await api.get('/kb/search/related', {
            params: { query }
        });
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/kb', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/kb/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/kb/${id}`);
        return response.data;
    },

    async incrementViews(id: string) {
        const response = await api.put(`/kb/${id}/views`);
        return response.data;
    }
};

export const boletoService = {
    async getAll(params?: any) {
        const response = await api.get('/boletos', { params });
        return response.data;
    },

    async getPending() {
        const response = await api.get('/boletos/pending/list');
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/boletos', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/boletos/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/boletos/${id}`);
        return response.data;
    }
};

export const notificationService = {
    async getAll(isRead?: boolean) {
        const response = await api.get('/notifications', {
            params: isRead !== undefined ? { isRead } : {}
        });
        return response.data;
    },

    async markAsRead(id: string) {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
};

export { default as maintenanceService } from './maintenanceService';
export { default as assetTimelineService } from './assetTimelineService';
export { default as problemService } from './problemService';
export { ticketService } from './ticketService';
export { default as credentialService } from './credentialService';
export { authService } from './authService';
export { networkDeviceService } from './networkDeviceService';
export { userService } from './userService';
export { slaughterService, rancherService } from './slaughterService';
export * from './gatehouseService';
export * from './candidateService';
export * from './jobPositionService';
export { API_URL } from './api';




