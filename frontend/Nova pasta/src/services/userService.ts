import api from './api';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'tecnico' | 'cliente';
    active: boolean;
    isMaster?: boolean;
    createdAt: string;
}

export const userService = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    toggleActive: async (id: string) => {
        const response = await api.patch(`/users/${id}/toggle-active`);
        return response.data;
    },

    syncModules: async () => {
        const response = await api.post('/users/sync-modules');
        return response.data;
    }
};

export default userService;
