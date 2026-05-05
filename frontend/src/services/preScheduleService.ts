import api from './api';

export const preScheduleService = {
    getCalendar: async (month: string) => {
        const { data } = await api.get(`/slaughter-pre/calendar?month=${month}`);
        return data;
    },
    getScheduleByDate: async (date: string) => {
        const { data } = await api.get(`/slaughter-pre/${date}`);
        return data;
    },
    bulkSave: async (payload: any) => {
        const { data } = await api.post('/slaughter-pre/bulk', payload);
        return data;
    },
    updateSchedule: async (id: string, data: any) => {
        const { data: responseData } = await api.put(`/slaughter-pre/${id}`, data);
        return responseData;
    },
    publishSchedule: async (id: string) => {
        const { data } = await api.post(`/slaughter-pre/${id}/publish`);
        return data;
    },
    exportPdf: async (id: string) => {
        const { data } = await api.get(`/slaughter-pre/${id}/pdf`);
        return data;
    }
};
