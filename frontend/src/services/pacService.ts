import api from './api';
import {
    PacProgram,
    ProductionArea,
    ChecklistModel,
    ChecklistExecution,
    NonConformity
} from '../types/pac';

export const pacService = {
    // Programs
    getPrograms: async () => {
        const response = await api.get('/pac/programs');
        return response.data;
    },

    // Areas
    getAreas: async () => {
        const response = await api.get('/pac/areas');
        return response.data;
    },

    // Models
    getModels: async (params?: any) => {
        const response = await api.get('/pac/models', { params });
        return response.data;
    },
    getModelById: async (id: string) => {
        const response = await api.get(`/pac/models/${id}`);
        return response.data;
    },

    // Executions
    getExecutions: async (params?: any) => {
        const response = await api.get('/pac/executions', { params });
        return response.data;
    },
    openExecution: async (modeloId: string, areaId: string, turno: string) => {
        const response = await api.post('/pac/executions', { modeloId, areaId, turno });
        return response.data;
    },
    updateExecution: async (id: string, data: any) => {
        const response = await api.put(`/pac/executions/${id}`, data);
        return response.data;
    },
    finalizeExecution: async (id: string) => {
        const response = await api.post(`/pac/executions/${id}/finalize`);
        return response.data;
    },

    // Non-Conformities
    getNonConformities: async (params?: any) => {
        const response = await api.get('/pac/non-conformities', { params });
        return response.data;
    },
    getNcById: async (id: string) => {
        const response = await api.get(`/pac/non-conformities/${id}`);
        return response.data;
    },
    updateNc: async (id: string, data: any) => {
        const response = await api.put(`/pac/non-conformities/${id}`, data);
        return response.data;
    },

    // Audit Packages
    getAuditPackages: async (params?: any) => {
        const response = await api.get('/pac/audit-packages', { params });
        return response.data;
    },
    createAuditPackage: async (data: any) => {
        const response = await api.post('/pac/audit-packages', data);
        return response.data;
    }
};
