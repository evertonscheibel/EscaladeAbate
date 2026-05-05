import api from './api';

const deboningCutService = {
    getCuts: async (brokerId?: string) => {
        const url = brokerId ? `/deboning-cuts?broker=${brokerId}` : '/deboning-cuts';
        const { data } = await api.get(url);
        return data.data;
    },
    createCut: async (cutData: FormData) => {
        const { data } = await api.post('/deboning-cuts', cutData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.data;
    },
    updateCut: async (id: string, cutData: FormData) => {
        const { data } = await api.put(`/deboning-cuts/${id}`, cutData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.data;
    },
    deleteCut: async (id: string) => {
        const { data } = await api.delete(`/deboning-cuts/${id}`);
        return data.data;
    }
};

export default deboningCutService;
