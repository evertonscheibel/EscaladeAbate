import api from './api';
import { SlaughterClosure } from '../types/slaughterClosure';

const slaughterClosureService = {
    getClosureByDate: async (date: string) => {
        const { data } = await api.get<any>(`/slaughter-closure/${date}`);
        return data.data;
    },
    createFromPre: async (date: string) => {
        const { data } = await api.post<any>(`/slaughter-closure/${date}/from-pre`);
        return data.data;
    },
    updateClosure: async (id: string, updateData: Partial<SlaughterClosure>) => {
        const { data } = await api.put<any>(`/slaughter-closure/${id}`, updateData);
        return data.data;
    },
    reorderLines: async (id: string, order: { preLotRefId: string, sequence: number }[]) => {
        const { data } = await api.post(`/slaughter-closure/${id}/reorder`, { order });
        return data.data;
    },
    closeClosure: async (id: string) => {
        const { data } = await api.post(`/slaughter-closure/${id}/close`);
        return data.data;
    },
    reopenClosure: async (id: string, reason: string) => {
        const { data } = await api.post(`/slaughter-closure/${id}/reopen`, { reason });
        return data.data;
    },
    exportClosure: (id: string, format: 'xlsm' | 'pdf') =>
        api.get(`/slaughter-closure/${id}/export?format=${format}`, { responseType: 'blob' }),
    exportPdf: async (id: string) => {
        const { data } = await api.get<any>(`/slaughter-closure/${id}/pdf`);
        return data.pdfUrl;
    }
};



export default slaughterClosureService;
