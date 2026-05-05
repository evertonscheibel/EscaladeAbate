// ============================================================
// TIPOS — Módulo Indústria: Escala de Abate & Fechamento SIF
// Bridge Gestão TI · Frizelo Frigoríficos
// Cole em: src/types/slaughter.ts e src/types/slaughterClosure.ts
// ============================================================

// ── src/types/slaughter.ts ──────────────────────────────────

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

// ---- Pré-Escala ----

export interface SlaughterPreLot {
    _id?: string;
    preLotRefId: string;           // UUID – chave de dedupe
    producerName: string;          // Obrigatório
    municipio: string;
    uf: string;                    // 2 letras, uppercase
    brokerCode?: string;
    brokerName?: string;
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    total: number;                 // Calculado automaticamente
    notes?: string;
}

export type PreScheduleStatus = 'DRAFT' | 'ENVIADA' | 'PUBLISHED' | 'CANCELADA';

export interface SlaughterPreSchedule {
    _id: string;
    date: Date | string;
    startTime: string;             // "HH:mm", default "07:00"
    rateHeadsPerHour: number;      // Cabeças/hora, default 100
    status: PreScheduleStatus;
    lots: SlaughterPreLot[];
    totalCattle: number;           // Calculado
    breakfastTime?: string;        // "HH:mm", default "08:00"
    breakfastDuration?: number;    // Minutos, default 15
    lunchTime?: string;            // "HH:mm", default "11:00"
    lunchDuration?: number;        // Minutos, default 70
    notes?: string;
    lastRequestId?: string;        // UUID para idempotência
    createdBy: string;
    updatedBy?: string;
    publishedBy?: string;
    publishedAt?: Date;
    version?: number;
    history?: Array<{
        version: number;
        updatedAt: Date;
        updatedBy: string;
        snapshot: any;
        changeLog?: string;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---- Escala de Abate ----

export interface SlaughterLot {
    _id?: string;
    schedule?: string;             // ObjectId da escala
    lotNumber: number;
    rancher?: Rancher;
    rancherName: string;           // Obrigatório
    brokerNumber: string;          // Obrigatório
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    total: number;                 // Calculado (sum de categorias)
    startTime: string;             // "HH:mm" – calculado
    durationMinutes: number;       // Calculado
    endTime: string;               // "HH:mm" – calculado
    order: number;                 // Ordem de processamento
    createdAt?: Date;
    updatedAt?: Date;
}

export type ScheduleStatus = 'DRAFT' | 'CLOSED';

export interface SlaughterSchedule {
    _id: string;
    slaughterDate: Date | string;
    startTime: string;             // "HH:mm"
    rateHeadsPerHour: number;
    status: ScheduleStatus;
    totalBoi: number;              // Desnormalizado
    totalVaca: number;
    totalNovilha: number;
    totalBubalino: number;
    totalTouro: number;
    totalCattle: number;           // Soma de todas as categorias
    breakfastTime?: string;
    breakfastDuration?: number;
    lunchTime?: string;
    lunchDuration?: number;
    pdfUrl?: string;
    notes?: string;
    lots: SlaughterLot[];          // Virtual populate
    createdBy: string;
    closedBy?: string;
    closedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---- Calendário ----

export type CalendarDayStatus = 'DRAFT' | 'ENVIADA' | 'PUBLISHED' | 'CANCELADA' | 'CLOSED' | null;

export interface CalendarDay {
    date: string;                  // "YYYY-MM-DD"
    status: CalendarDayStatus;
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

// ---- Auditoria ----

export interface SlaughterVersion {
    _id: string;
    resourceId: string;
    resourceType: 'SlaughterSchedule' | 'SlaughterLot';
    version: number;
    data: any;
    changedBy: string;
    changeReason?: string;
    metadata?: {
        ip?: string;
        userAgent?: string;
    };
    createdAt?: Date;
}


// ── src/types/slaughterClosure.ts ──────────────────────────

export interface SlaughterClosureLine {
    _id?: string;
    sequence: number;
    preLotRefId: string;           // Chave de vínculo com a pré-escala
    producerName: string;          // Obrigatório
    municipio: string;             // Obrigatório para fechar
    uf: string;                    // Obrigatório para fechar (2 chars)
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    total: number;                 // Calculado
    brokerCode?: string;
    brokerName?: string;
    curral: string;                // Obrigatório para fechar (baia de embarque)
    cor: string;                   // Cor da ficha/brinco
    nf: string;                    // Número da Nota Fiscal
    gta: string;                   // Guia de Trânsito Animal
    observations?: string;
}

export interface SlaughterClosureHeader {
    slaughterDate: Date | string;
    sifNumber: string;             // Número SIF do estabelecimento (ex: "SIF 4141")
    veterinarian?: string;         // Médico veterinário responsável
    notes?: string;
}

export interface ReopenLogEntry {
    by: string | { _id: string; name: string };
    at: Date | string;
    reason: string;
}

export type ClosureStatus = 'DRAFT' | 'CLOSED';

export interface SlaughterClosure {
    _id: string;
    date: Date | string;
    scheduleId?: string | { _id: string; slaughterDate: Date; status: string; totalCattle: number };
    status: ClosureStatus;
    header: SlaughterClosureHeader;
    lines: SlaughterClosureLine[];
    totalCattle: number;           // Calculado
    createdBy?: string;
    updatedBy?: string;
    closedBy?: string | { _id: string; name: string };
    closedAt?: Date | string;
    reopenLog?: ReopenLogEntry[];
    createdAt?: Date;
    updatedAt?: Date;
}

// ---- Formulários / DTOs ----

export interface CreateLotDTO {
    rancherName: string;
    brokerNumber: string;
    boi?: number;
    vaca?: number;
    novilha?: number;
    bubalino?: number;
    touro?: number;
    changeReason?: string;
}

export interface UpdateScheduleDTO {
    startTime?: string;
    rateHeadsPerHour?: number;
    breakfastTime?: string;
    breakfastDuration?: number;
    lunchTime?: string;
    lunchDuration?: number;
    notes?: string;
    changeReason?: string;
}

export interface UpdateClosureLineDTO {
    curral?: string;
    cor?: string;
    nf?: string;
    gta?: string;
    municipio?: string;
    uf?: string;
    observations?: string;
}

export interface ReopenClosureDTO {
    reason: string;
}

// ---- Constantes ----

export const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Rascunho',
    ENVIADA: 'Enviada',
    PUBLISHED: 'Publicada',
    CANCELADA: 'Cancelada',
    CLOSED: 'Fechada',
};

export const STATUS_COLORS: Record<string, string> = {
    DRAFT: '#6b7280',      // cinza
    ENVIADA: '#d97706',    // amarelo
    PUBLISHED: '#2563eb',  // azul
    CANCELADA: '#dc2626',  // vermelho
    CLOSED: '#16a34a',     // verde
};

export const UF_LIST = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO',
    'MA','MT','MS','MG','PA','PB','PR','PE','PI',
    'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export const CATTLE_CATEGORIES = [
    { key: 'boi',      label: 'Boi' },
    { key: 'vaca',     label: 'Vaca' },
    { key: 'novilha',  label: 'Novilha' },
    { key: 'bubalino', label: 'Bubalino' },
    { key: 'touro',    label: 'Touro' },
] as const;

export type CattleCategory = typeof CATTLE_CATEGORIES[number]['key'];
