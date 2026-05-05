export interface SlaughterClosureLine {
    _id?: string;
    sequence: number;
    preLotRefId: string;
    producerName: string;
    municipio: string;
    uf: string;
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    total: number;
    brokerCode?: string;
    brokerName?: string;
    curral: string;
    cor: string;
    nf: string;
    gta: string;
    observations?: string;
}

export interface SlaughterClosure {
    _id: string;
    date: string;
    status: 'DRAFT' | 'CLOSED';
    preScheduleId?: any;
    header: {
        slaughterDate: string;
        sifNumber: string;
        veterinarian?: string;
        notes?: string;
    };
    lines: SlaughterClosureLine[];
    totalCattle: number;
    closedAt?: string;
    reopenLog?: Array<{
        by: any;
        at: string;
        reason: string;
    }>;
}
