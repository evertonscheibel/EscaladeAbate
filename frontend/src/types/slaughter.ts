export interface Rancher {
    _id: string;
    name: string;
    cpfCnpj?: string;
    phone?: string;
    email?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    active?: boolean;
    notes?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SlaughterLot {
    _id?: string;
    schedule?: string;
    lotNumber: number;
    rancher?: Rancher;
    rancherName: string;
    brokerNumber: string;
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    total: number;
    startTime: string;
    durationMinutes: number;
    endTime: string;
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SlaughterSchedule {
    _id: string;
    slaughterDate: Date;
    startTime: string;
    rateHeadsPerHour: number;
    status: 'DRAFT' | 'CLOSED';
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
    totalCattle: number;
    breakfastTime?: string;
    breakfastDuration?: number;
    lunchTime?: string;
    lunchDuration?: number;
    pdfUrl?: string;
    notes?: string;
    lots: SlaughterLot[];
    createdBy: string;
    closedBy?: string;
    closedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CalendarDay {
    date: string;
    status: 'DRAFT' | 'ENVIADA' | 'PUBLISHED' | 'CANCELADA' | null;
    totalCattle?: number;
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
}

export interface MonthlySummary {
    totalBoi: number;
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
    totalCattle: number;
    closedDays: number;
}

export interface CalendarResponse {
    success: boolean;
    data: CalendarDay[];
    monthlySummary: MonthlySummary;
}

export interface SlaughterPreLot {
    _id?: string;
    preLotRefId: string;
    producerName: string;
    municipio: string;
    uf: string;
    brokerCode?: string;
    brokerName?: string;
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    total: number;
    notes?: string;
}

export interface SlaughterPreSchedule {
    _id: string;
    date: Date;
    startTime: string;
    rateHeadsPerHour: number;
    status: 'DRAFT' | 'ENVIADA' | 'PUBLISHED' | 'CANCELADA';
    lots: SlaughterPreLot[];
    totalCattle: number;
    breakfastTime?: string;
    breakfastDuration?: number;
    lunchTime?: string;
    lunchDuration?: number;
    notes: string;
    lastRequestId?: string;
    createdBy: string;
    updatedBy?: string;
    publishedBy?: string;
    publishedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
