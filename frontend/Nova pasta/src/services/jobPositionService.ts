import api from './api';

export interface JobPosition {
    _id: string;
    id_externo: string;
    titulo_vaga: string;
    setor: string;
    gestor?: string;
    empresa?: string;
    regiao?: string;
    status: 'EM_ABERTO' | 'FECHADA' | 'CANCELADA';
    qtd_vagas: number;
    observacao?: string;
    salario?: {
        salario_base?: number;
        faixa_min?: number;
        faixa_max?: number;
        niveis?: Record<string, number>;
        moeda: string;
        confianca?: string;
        referencia_cargo?: string;
        referencia_setor?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export const jobPositionService = {
    // Público
    getOpen: () => api.get<JobPosition[]>('/job-positions/open'),

    // Admin
    getAll: () => api.get<JobPosition[]>('/job-positions'),
    getById: (id: string) => api.get<JobPosition>(`/job-positions/${id}`)
};
