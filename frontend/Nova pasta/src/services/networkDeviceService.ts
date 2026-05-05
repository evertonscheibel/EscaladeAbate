import api from './api';

export const networkDeviceService = {
    // Dashboard
    async getDashboard() {
        const response = await api.get('/network-devices/dashboard');
        return response.data;
    },

    // Topologia
    async getTopology() {
        const response = await api.get('/network-devices/topology');
        return response.data;
    },

    // CRUD
    async getAll(params?: any) {
        const response = await api.get('/network-devices', { params });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/network-devices/${id}`);
        return response.data;
    },

    async getByLocation(location: string) {
        const response = await api.get(`/network-devices/location/${encodeURIComponent(location)}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/network-devices', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/network-devices/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/network-devices/${id}`);
        return response.data;
    },

    // Status e métricas
    async updateStatus(id: string, status: string, metrics?: any) {
        const response = await api.put(`/network-devices/${id}/status`, { status, metrics });
        return response.data;
    },

    async updatePorts(id: string, ports: any[]) {
        const response = await api.put(`/network-devices/${id}/ports`, { ports });
        return response.data;
    },

    async importExcel(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/network-devices/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default networkDeviceService;
