export interface DeboningTeam {
    teamName: string;
    leader?: string;
    members: number;
    sector: 'TRASEIRO' | 'DIANTEIRO' | 'MIUDOS' | 'EMBALAGEM' | 'CARREGAMENTO' | 'GERAL';
}

export interface LotProduction {
    traseiro: number;
    dianteiro: number;
    pontaAgulha: number;
    recortes: number;
    osso: number;
    sebo: number;
    miudos: number;
    outros: number;
}

export interface DeboningLot {
    _id?: string;
    schedule?: string;
    lotNumber: number;
    slaughterLot?: {
        _id: string;
        lotNumber: number;
        rancherName: string;
        brokerNumber: string;
    };
    origin: string;
    sifNumber?: string;
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    totalCarcassas: number;
    pesoMedioCarcassa: number;
    production: LotProduction;
    totalProduzidoKg: number;
    destino: 'MERCADO_INTERNO' | 'EXPORTACAO' | 'MERCADO_INTERNO_EXPORTACAO' | 'INDUSTRIALIZACAO';
    destinoDetalhe?: string;
    lotStatus: 'PENDENTE' | 'EM_PROCESSO' | 'CONCLUIDO';
    startTime: string;
    durationMinutes: number;
    endTime: string;
    order: number;
    qualityNotes?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DeboningSchedule {
    _id: string;
    scheduleDate: Date;
    slaughterSchedule?: {
        _id: string;
        slaughterDate: Date;
        status: string;
        totalCattle: number;
    };
    startTime: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED';
    targetCarcassesPerHour: number;
    totalCarcassas: number;
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
    totalTraseiro: number;
    totalDianteiro: number;
    totalPonta: number;
    totalRecortes: number;
    totalOsso: number;
    totalSebo: number;
    totalProduzidoKg: number;
    breakfastTime?: string;
    breakfastDuration?: number;
    lunchTime?: string;
    lunchDuration?: number;
    teams: DeboningTeam[];
    chamberTemperature?: number;
    pdfUrl?: string;
    notes?: string;
    lots: DeboningLot[];
    createdBy: string;
    closedBy?: string;
    closedAt?: Date;
    startedBy?: string;
    startedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DeboningCalendarDay {
    date: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED' | null;
    totalCarcassas?: number;
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
    totalProduzidoKg: number;
}

export interface DeboningMonthlySummary {
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
    totalCarcassas: number;
    totalProduzidoKg: number;
    closedDays: number;
}

export interface ProductionSummary {
    totalLots: number;
    byDestino: Record<string, { carcassas: number; produzidoKg: number }>;
    byStatus: { PENDENTE: number; EM_PROCESSO: number; CONCLUIDO: number };
    rendimentoPercent: number;
    pesoTotalEstimado: number;
    totalProduzidoKg: number;
    production: {
        traseiro: number;
        dianteiro: number;
        ponta: number;
        recortes: number;
        osso: number;
        sebo: number;
    };
}

export interface SlaughterAvailable {
    _id: string;
    slaughterDate: string;
    totalCattle: number;
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
}
