import api from './api';

const deboningService = {
    getCalendar: async (month: string) => {
        const { data } = await api.get(`/deboning/calendar?month=${month}`);
        return data.data;
    },
    getScheduleByDate: async (date: string) => {
        const { data } = await api.get<any>(`/deboning/schedules/${date}`);
        return data.data;
    },
    updateSchedule: async (id: string, updateData: any) => {
        const { data } = await api.put(`/deboning/schedules/${id}`, updateData);
        return data.data;
    },
    importFromSlaughter: async (scheduleId: string, slaughterDate: string) => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/import-slaughter/${slaughterDate}`);
        return data.data;
    },
    getAvailableSlaughter: async (from: string, to: string) => {
        const { data } = await api.get(`/deboning/available-slaughter?from=${from}&to=${to}`);
        return data.data;
    },
    createLot: async (scheduleId: string, lotData: any) => {
        const { data } = await api.post(`/deboning/schedules/${scheduleId}/lots`, lotData);
        return data.data;
    },
    updateLot: async (id: string, lotData: any) => {
        const { data } = await api.put(`/deboning/lots/${id}`, lotData);
        return data.data;
    },
    async updateLotProduction(id: string, production: any, lotStatus: string): Promise<any> {
        const response = await api.put(`/deboning/lots/${id}/production`, { production, lotStatus });
        return response.data.data;
    },

    // --- Peças ---
    async getPieces(): Promise<any[]> {
        const response = await api.get('/deboning/pieces');
        return response.data.data;
    },

    async createPiece(data: any): Promise<any> {
        const response = await api.post('/deboning/pieces', data);
        return response.data.data;
    },

    async updatePiece(id: string, data: any): Promise<any> {
        const response = await api.put(`/deboning/pieces/${id}`, data);
        return response.data.data;
    },

    async deletePiece(id: string): Promise<any> {
        const response = await api.delete(`/deboning/pieces/${id}`);
        return response.data;
    },
    deleteLot: async (id: string) => {
        const { data } = await api.delete(`/deboning/lots/${id}`);
        return data.data;
    },
    recalculateLots: async (id: string) => {
        const { data } = await api.post(`/deboning/schedules/${id}/recalculate`);
        return data.data;
    },
    reorderLots: async (id: string, lotIds: string[]) => {
        const { data } = await api.post(`/deboning/schedules/${id}/reorder`, { lotIds });
        return data.data;
    },
    startSchedule: async (id: string) => {
        const { data } = await api.post(`/deboning/schedules/${id}/start`);
        return data.data;
    },
    closeSchedule: async (id: string) => {
        const { data } = await api.post(`/deboning/schedules/${id}/close`);
        return data.data;
    },
    reopenSchedule: async (id: string) => {
        const { data } = await api.post(`/deboning/schedules/${id}/reopen`);
        return data.data;
    },
    getProductionSummary: async (id: string) => {
        const { data } = await api.get(`/deboning/schedules/${id}/production-summary`);
        return data.data;
    },
    exportToPdf: async (id: string) => {
        const { data } = await api.get(`/deboning/schedules/${id}/pdf`);
        return data.data;
    },

    // --- PCP Execution (OPs) ---
    startOp: async (opId: string) => {
        const { data } = await api.post(`/pcp/ops/${opId}/iniciar`);
        return data.data;
    },
    pauseOp: async (opId: string, payload: { motivoParadaId: string, observacao: string }) => {
        const { data } = await api.post(`/pcp/ops/${opId}/pausar`, payload);
        return data.data;
    },
    resumeOp: async (opId: string) => {
        const { data } = await api.post(`/pcp/ops/${opId}/retomar`);
        return data.data;
    },
    finishOp: async (opId: string, payload: { fimReal: string, qtdReal: number, pesoRealKg?: number, observacao?: string }) => {
        const { data } = await api.post(`/pcp/ops/${opId}/finalizar`, payload);
        return data.data;
    },
    getDowntimeReasons: async () => {
        const { data } = await api.get('/pcp/motivos-parada');
        return data.data;
    },
    getAnalytics: async (scheduleId: string) => {
        const { data } = await api.get(`/pcp/programacoes/${scheduleId}/analytics`);
        return data.data;
    }
};



export default deboningService;
