import api from './api';
import {
    DeboningSchedule,
    DeboningCalendarDay,
    DeboningMonthlySummary,
    DeboningLot,
    ProductionSummary,
    SlaughterAvailable,
    LotProduction
} from '../types/deboning';

export const deboningService = {
    getCalendar: async (month: string): Promise<{ data: DeboningCalendarDay[], monthlySummary: DeboningMonthlySummary }> => {
        const { data } = await api.get(`/deboning/calendar?month=${month}`);
        return { data: data.data, monthlySummary: data.monthlySummary };
    },

    getScheduleByDate: async (date: string): Promise<DeboningSchedule> => {
        const { data } = await api.get(`/deboning/schedules/${date}`);
        return data.data;
    },

    updateSchedule: async (id: string, updates: Partial<DeboningSchedule>): Promise<DeboningSchedule> => {
        const { data } = await api.put(`/deboning/schedules/${id}`, updates);
        return data.data;
    },

    getAvailableSlaughter: async (from?: string, to?: string): Promise<SlaughterAvailable[]> => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const { data } = await api.get(`/deboning/available-slaughter?${params.toString()}`);
        return data.data;
    },

    importFromSlaughter: async (scheduleId: string, slaughterDate: string): Promise<DeboningSchedule> => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/import-slaughter/${slaughterDate}`);
        return data.data;
    },

    createLot: async (scheduleId: string, lot: Partial<DeboningLot>): Promise<DeboningLot> => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/lots`, lot);
        return data.data;
    },

    updateLot: async (id: string, updates: Partial<DeboningLot>): Promise<DeboningLot> => {
        const { data } = await api.put(`/deboning/lots/${id}`, updates);
        return data.data;
    },

    updateLotProduction: async (id: string, production: Partial<LotProduction>, lotStatus?: string): Promise<DeboningLot> => {
        const { data } = await api.put(`/deboning/lots/${id}/production`, { production, lotStatus });
        return data.data;
    },

    deleteLot: async (id: string): Promise<void> => {
        await api.delete(`/deboning/lots/${id}`);
    },

    recalculate: async (scheduleId: string): Promise<DeboningSchedule> => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/recalculate`);
        return data.data;
    },

    start: async (scheduleId: string): Promise<DeboningSchedule> => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/start`);
        return data.data;
    },

    close: async (scheduleId: string): Promise<DeboningSchedule> => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/close`);
        return data.data;
    },

    reopen: async (scheduleId: string): Promise<DeboningSchedule> => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/reopen`);
        return data.data;
    },

    reorder: async (id: string, lotIds: string[]): Promise<DeboningSchedule> => {
        const { data } = await api.post(`/deboning/schedules/${id}/reorder`, { lotIds });
        return data.data;
    },

    getProductionSummary: async (scheduleId: string): Promise<ProductionSummary> => {
        const { data } = await api.get(`/deboning/schedules/${scheduleId}/production-summary`);
        return data.data;
    }
};
