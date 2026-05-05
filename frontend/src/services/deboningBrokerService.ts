import api from './api';

const deboningBrokerService = {
    getBrokers: async () => {
        const { data } = await api.get('/deboning-brokers');
        return data.data;
    },
    getBroker: async (id: string) => {
        const { data } = await api.get(`/deboning-brokers/${id}`);
        return data.data;
    },
    createBroker: async (brokerData: any) => {
        const { data } = await api.post('/deboning-brokers', brokerData);
        return data.data;
    },
    updateBroker: async (id: string, brokerData: any) => {
        const { data } = await api.put(`/deboning-brokers/${id}`, brokerData);
        return data.data;
    },
    deleteBroker: async (id: string) => {
        const { data } = await api.delete(`/deboning-brokers/${id}`);
        return data.data;
    }
};

export default deboningBrokerService;
