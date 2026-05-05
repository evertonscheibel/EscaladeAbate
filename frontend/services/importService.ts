import api from './api';

export interface ImportJob {
    _id: string;
    type: string;
    status: string;
    fileName: string;
    totalRows: number;
    validRows: number;
    errorRows: number;
    targetDate?: string;
}

const importService = {
    upload: (type: string, date: string, file: File) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('targetDate', date);
        formData.append('file', file);
        return api.post('/import/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getJobStatus: (id: string) => api.get(`/import/jobs/${id}`),
    commitJob: (id: string) => api.post(`/import/jobs/${id}/commit`),
};

export default importService;
