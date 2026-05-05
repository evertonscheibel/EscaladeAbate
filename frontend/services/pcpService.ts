import api from './api';
import { PcpDayPlan, MarketDestination, ExternalLot } from '../types/pcp';

const pcpService = {
    getCalendar: async (month: string) => {
        const { data } = await api.get(`/pcp/calendar?month=${month}`);
        return data.data;
    },
    getDayPlan: async (date: string) => {
        const { data } = await api.get<any>(`/pcp/day/${date}`);
        return data.data;
    },
    updateDayPlan: async (id: string, updateData: Partial<PcpDayPlan>) => {
        const { data } = await api.put<any>(`/pcp/day/${id}`, updateData);
        return data.data;
    },
    startDayPlan: async (id: string) => {
        const { data } = await api.post(`/pcp/day/${id}/start`);
        return data.data;
    },
    closeDayPlan: async (id: string) => {
        const { data } = await api.post(`/pcp/day/${id}/close`);
        return data.data;
    },
    getMarkets: async () => {
        const { data } = await api.get<any>('/pcp/markets');
        return data.data;
    },
    getExternalLots: async (date?: string) => {
        const { data } = await api.get<any>(`/pcp/external-lots${date ? `?date=${date}` : ''}`);
        return data.data;
    },
    createExternalLot: async (externalLotData: Partial<ExternalLot>) => {
        const { data } = await api.post<any>('/pcp/external-lots', externalLotData);
        return data.data;
    },
    updateExternalLot: async (id: string, externalLotData: Partial<ExternalLot>) => {
        const { data } = await api.put<any>(`/pcp/external-lots/${id}`, externalLotData);
        return data.data;
    },
    deleteExternalLot: async (id: string) => {
        const { data } = await api.delete(`/pcp/external-lots/${id}`);
        return data.data;
    },
};


export default pcpService;
