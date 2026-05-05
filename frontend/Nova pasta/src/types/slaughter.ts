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
    totalCattle: number;
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
    status: 'DRAFT' | 'CLOSED' | null;
    totalCattle?: number;
}
