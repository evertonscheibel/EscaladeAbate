import api from './api';

export interface Candidate {
    _id: string;
    fullName: string;
    cpf: string;
    birthDate: string;
    gender: string;
    maritalStatus: string;
    email: string;
    phone: string;
    whatsapp?: string;
    address: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city: string;
        state: string;
        zipCode?: string;
    };
    desiredPosition: string;
    desiredSalary?: number;
    availableStartDate?: string;
    workShift: string;
    education: string;
    courses?: string;
    languages?: string;
    skills?: string;
    experiences: Array<{
        company: string;
        position: string;
        startDate: string;
        endDate?: string;
        currentJob: boolean;
        description?: string;
    }>;
    status: string;
    priority: string;
    source: string;
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
    };
    interviews: Array<{
        _id: string;
        scheduledDate: string;
        type: string;
        interviewer?: string;
        location?: string;
        notes?: string;
        status: string;
        feedback?: string;
        rating?: number;
        createdAt: string;
    }>;
    notes: Array<{
        _id: string;
        content: string;
        author: string;
        createdAt: string;
    }>;
    documents: Array<{
        _id: string;
        name: string;
        type?: string;
        url?: string;
        uploadedAt: string;
    }>;
    overallRating?: number;
    protocol: string;
    lgpdConsent: boolean;
    lgpdConsentDate: string;
    observations?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CandidateFilters {
    status?: string;
    desiredPosition?: string;
    search?: string;
    assignedTo?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const candidateService = {
    // Público
    createPublic: (data: any) => api.post('/candidates/public', data),

    // Privado (RH/Admin)
    getAll: (filters: CandidateFilters) => api.get('/candidates', { params: filters }),

    create: (data: Partial<Candidate>) => api.post('/candidates', data),

    getById: (id: string) => api.get(`/candidates/${id}`),

    update: (id: string, data: any) => api.put(`/candidates/${id}`, data),

    delete: (id: string) => api.delete(`/candidates/${id}`),

    updateStatus: (id: string, status: string) =>
        api.patch(`/candidates/${id}/status`, { status }),

    assign: (id: string, userId: string | null) =>
        api.patch(`/candidates/${id}/assign`, { assignedTo: userId }),

    addNote: (id: string, content: string) =>
        api.post(`/candidates/${id}/notes`, { content }),

    scheduleInterview: (id: string, data: any) =>
        api.post(`/candidates/${id}/interviews`, data),

    updateInterview: (id: string, interviewId: string, data: any) =>
        api.patch(`/candidates/${id}/interviews/${interviewId}`, data),

    addDocument: (id: string, data: any) =>
        api.post(`/candidates/${id}/documents`, data),

    getDashboard: () => api.get('/candidates/dashboard'),

    lgpdCleanup: () => api.post('/candidates/lgpd/cleanup')
};
