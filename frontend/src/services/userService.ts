import api from './api';

export const userService = {
    // Listar usuários
    getAll: (params?: any) => api.get('/users', { params }),

    // Estatísticas
    getStats: () => api.get('/users/stats'),

    // Detalhe
    getById: (id: string) => api.get(`/users/${id}`),

    // CRUD
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),

    // Permissões
    updatePermissions: (id: string, data: any) => api.put(`/users/${id}/permissions`, data),
    syncModules: () => api.post('/users/sync-modules'),

    // Ações
    toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
    deactivate: (id: string, reason?: string) => api.put(`/users/${id}/deactivate`, { reason }),
    reactivate: (id: string) => api.put(`/users/${id}/reactivate`),
    resetPassword: (id: string) => api.post(`/users/${id}/reset-password`),

    // Auditoria
    getAuditLog: (id: string, params?: any) => api.get(`/users/${id}/audit-log`, { params }),
};

export const permissionProfileService = {
    getAll: () => api.get('/permission-profiles'),
    getById: (id: string) => api.get(`/permission-profiles/${id}`),
    create: (data: any) => api.post('/permission-profiles', data),
    update: (id: string, data: any) => api.put(`/permission-profiles/${id}`, data),
    delete: (id: string) => api.delete(`/permission-profiles/${id}`),
};
