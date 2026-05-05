import api from './api';
import {
    GatehouseAccess, DashboardKPIs, Vehicle, AccessPerson,
    Company, Gatehouse, AccessType, AccessReason
} from '../types/gatehouse';

export const gatehouseService = {
    // Operações
    getDashboardKPIs: async () => {
        const response = await api.get('/gatehouse/dashboard/kpis');
        return response.data;
    },

    getInPatio: async (params?: { guarita_id?: string; tipo_acesso_id?: string; search?: string }) => {
        const response = await api.get('/gatehouse/access/in-patio', { params });
        return response.data;
    },

    getHistory: async (params: any) => {
        const response = await api.get('/gatehouse/access/history', { params });
        return response.data;
    },

    registerEntry: async (data: any) => {
        const response = await api.post('/gatehouse/access/entry', data);
        return response.data;
    },

    registerExit: async (id: string, data: { observacao_saida?: string; houve_ocorrencia?: boolean; descricao_ocorrencia?: string }) => {
        const response = await api.put(`/gatehouse/access/${id}/exit`, data);
        return response.data;
    },

    editAccess: async (id: string, data: { campo: string; valor: any; motivo_edicao: string }) => {
        const response = await api.put(`/gatehouse/access/${id}/edit`, data);
        return response.data;
    },

    // Cadastros
    getVehicles: async (params?: { search?: string; recorrente?: boolean }) => {
        const response = await api.get('/gatehouse/vehicles', { params });
        return response.data;
    },

    createVehicle: async (data: Partial<Vehicle>) => {
        const response = await api.post('/gatehouse/vehicles', data);
        return response.data;
    },

    getPeople: async (params?: { search?: string }) => {
        const response = await api.get('/gatehouse/people', { params });
        return response.data;
    },

    createPerson: async (data: Partial<AccessPerson>) => {
        const response = await api.post('/gatehouse/people', data);
        return response.data;
    },

    getCompanies: async (params?: { search?: string }) => {
        const response = await api.get('/gatehouse/companies', { params });
        return response.data;
    },

    createCompany: async (data: Partial<Company>) => {
        const response = await api.post('/gatehouse/companies', data);
        return response.data;
    },

    // Configurações
    getConfigs: {
        gatehouses: async () => {
            const response = await api.get('/gatehouse/configs/gatehouses');
            return response.data;
        },
        types: async () => {
            const response = await api.get('/gatehouse/configs/types');
            return response.data;
        },
        reasons: async (tipo_acesso_id?: string) => {
            const response = await api.get('/gatehouse/configs/reasons', { params: { tipo_acesso_id } });
            return response.data;
        }
    }
};
