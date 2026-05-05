import api from './api';
import { SlaughterSchedule, CalendarDay, SlaughterLot, Rancher } from '../types/slaughter';

export const slaughterService = {
    getCalendar: async (month: string): Promise<CalendarDay[]> => {
        const { data } = await api.get(`/slaughter/calendar?month=${month}`);
        return data.data;
    },

    getScheduleByDate: async (date: string): Promise<SlaughterSchedule> => {
        const { data } = await api.get(`/slaughter/schedules/${date}`);
        return data.data;
    },

    updateSchedule: async (id: string, updates: Partial<SlaughterSchedule>): Promise<SlaughterSchedule> => {
        const { data } = await api.put(`/slaughter/schedules/${id}`, updates);
        return data.data;
    },

    createLot: async (scheduleId: string, lot: Partial<SlaughterLot>): Promise<SlaughterLot> => {
        const { data } = await api.post(`/slaughter/schedules/${scheduleId}/lots`, lot);
        return data.data;
    },

    updateLot: async (id: string, updates: Partial<SlaughterLot>): Promise<SlaughterLot> => {
        const { data } = await api.put(`/slaughter/lots/${id}`, updates);
        return data.data;
    },

    deleteLot: async (id: string): Promise<void> => {
        await api.delete(`/slaughter/lots/${id}`);
    },

    recalculate: async (scheduleId: string): Promise<SlaughterSchedule> => {
        const { data } = await api.post(`/slaughter/schedules/${scheduleId}/recalculate`);
        return data.data;
    },

    close: async (scheduleId: string): Promise<SlaughterSchedule> => {
        const { data } = await api.post(`/slaughter/schedules/${scheduleId}/close`);
        return data.data;
    },

    reopen: async (scheduleId: string): Promise<SlaughterSchedule> => {
        const { data } = await api.post(`/slaughter/schedules/${scheduleId}/reopen`);
        return data.data;
    }
};

export const rancherService = {
    search: async (query: string): Promise<Rancher[]> => {
        const { data } = await api.get(`/ranchers/search?q=${query}`);
        return data.data;
    },

    create: async (rancher: Partial<Rancher>): Promise<Rancher> => {
        const { data } = await api.post('/ranchers', rancher);
        return data.data;
    }
};
