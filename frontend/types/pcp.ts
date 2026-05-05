export interface PcpMarketTargets {
    MI: number;
    EXP: number;
    IND: number;
}

export interface PcpDayPlan {
    _id: string;
    date: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED';
    links: {
        preScheduleId?: string;
        closureId?: string;
        deboningScheduleId?: string;
    };
    capacity: {
        targetCarcassesPerHour: number;
        shifts: Array<{ start: string; end: string; teamName: string }>;
        breaks: Array<{ start: string; end: string; label: string }>;
        coldRoomCapacity?: number;
    };
    plannedByMarket: PcpMarketTargets;
    realizedByMarket: PcpMarketTargets;
    totalSlaughterCattle: number;
    totalDeboningCarcasses: number;
    totalExternalLots: number;
    notes?: string;
}

export interface MarketDestination {
    _id: string;
    code: string;
    name: string;
    active: boolean;
    requiresExportDocs: boolean;
}

export interface ExternalLot {
    _id: string;
    externalLotCode: string;
    arrivalDate: string;
    slaughterDate?: string;
    supplierName: string;
    documents?: {
        nf?: string;
        gta?: string;
    };
    defaultMarket: 'MI' | 'EXP' | 'IND' | 'MI_EXP';
    weightInKg?: number;
    carcasses: number;
}
