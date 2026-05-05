// ============================================================
// SERVIÇOS HTTP — Módulo Indústria: Escala de Abate & SIF
// Bridge Gestão TI · Frizelo Frigoríficos
// ============================================================
// Cole em: src/services/
// Requer: token JWT via localStorage ('token') ou AuthContext
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helper interno ───────────────────────────────────────────

async function fetchAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Erro na requisição');
    return data;
}

// ════════════════════════════════════════════════════════════
// PRÉ-ESCALA  (src/services/preScheduleService.ts)
// ════════════════════════════════════════════════════════════

const PRE = `${API_BASE}/slaughter/pre-schedule`;

/** Calendário mensal da pré-escala. month = "YYYY-MM" */
export const preSchedule = {
    getCalendar: (month: string) =>
        fetchAuth(`${PRE}/calendar?month=${month}`),

    /** Busca por data. Cria DRAFT automaticamente se não existir. */
    getByDate: (date: string) =>
        fetchAuth(`${PRE}/${date}`),

    /**
     * Atualiza pré-escala (lotes, parâmetros, status).
     * Campos aceitos: startTime, rateHeadsPerHour, lots, totalCattle,
     * status, notes, breakfastTime, breakfastDuration, lunchTime, lunchDuration
     */
    update: (id: string, data: Record<string, any>) =>
        fetchAuth(`${PRE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Publica pré-escala → sincroniza com Escala de Abate */
    publish: (id: string) =>
        fetchAuth(`${PRE}/${id}/publish`, { method: 'POST' }),

    /** Bulk save: salva múltiplas pré-escalas de uma vez */
    bulkSave: (schedules: any[]) =>
        fetchAuth(`${PRE}/bulk`, {
            method: 'POST',
            body: JSON.stringify({ schedules }),
        }),

    /** Exporta PDF da pré-escala */
    exportPdf: (id: string) =>
        fetchAuth(`${PRE}/${id}/pdf`),
};


// ════════════════════════════════════════════════════════════
// ESCALA DE ABATE  (src/services/slaughterService.ts)
// ════════════════════════════════════════════════════════════

const SLAUGHTER = `${API_BASE}/slaughter`;

export const slaughter = {
    /** Calendário mensal. Retorna { data: CalendarDay[], monthlySummary } */
    getCalendar: (month: string) =>
        fetchAuth(`${SLAUGHTER}/calendar?month=${month}`),

    /** Busca escala por data (YYYY-MM-DD). Cria DRAFT se não existir. */
    getByDate: (date: string) =>
        fetchAuth(`${SLAUGHTER}/schedules/${date}`),

    /**
     * Atualiza parâmetros da escala.
     * Aciona recálculo automático se: startTime, rateHeadsPerHour,
     * breakfastTime, breakfastDuration, lunchTime, lunchDuration mudarem.
     */
    updateSchedule: (id: string, data: Record<string, any>) =>
        fetchAuth(`${SLAUGHTER}/schedules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Adiciona lote à escala. Calcula horários automaticamente. */
    createLot: (scheduleId: string, lot: Record<string, any>) =>
        fetchAuth(`${SLAUGHTER}/schedules/${scheduleId}/lots`, {
            method: 'POST',
            body: JSON.stringify(lot),
        }),

    /** Atualiza lote. Aciona recálculo de todos os lotes da escala. */
    updateLot: (lotId: string, data: Record<string, any>) =>
        fetchAuth(`${SLAUGHTER}/lots/${lotId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Remove lote. Aciona recálculo. */
    deleteLot: (lotId: string) =>
        fetchAuth(`${SLAUGHTER}/lots/${lotId}`, { method: 'DELETE' }),

    /**
     * Reordena lotes. Aciona recálculo de horários.
     * lotIds: array de IDs na nova ordem desejada
     */
    reorderLots: (scheduleId: string, lotIds: string[]) =>
        fetchAuth(`${SLAUGHTER}/schedules/${scheduleId}/reorder`, {
            method: 'POST',
            body: JSON.stringify({ lotIds }),
        }),

    /** Força recálculo de todos os horários */
    recalculate: (scheduleId: string) =>
        fetchAuth(`${SLAUGHTER}/schedules/${scheduleId}/recalculate`, {
            method: 'POST',
        }),

    /**
     * Fecha escala. Valida:
     * - Pelo menos 1 lote
     * - Nenhum lote com total = 0
     * Gera PDF e retorna pdfUrl.
     */
    close: (scheduleId: string) =>
        fetchAuth(`${SLAUGHTER}/schedules/${scheduleId}/close`, { method: 'POST' }),

    /** Reabre escala (apenas admin). Volta para DRAFT. */
    reopen: (scheduleId: string) =>
        fetchAuth(`${SLAUGHTER}/schedules/${scheduleId}/reopen`, { method: 'POST' }),
};


// ════════════════════════════════════════════════════════════
// FECHAMENTO SIF  (src/services/slaughterClosureService.ts)
// ════════════════════════════════════════════════════════════

const CLOSURE = `${API_BASE}/slaughter/closure`;

export const slaughterClosure = {
    /** Busca fechamento por data. Retorna null se não existir. */
    getByDate: (date: string) =>
        fetchAuth(`${CLOSURE}/${date}`),

    /**
     * Cria fechamento importando lotes da Escala CLOSED.
     * Pré-requisito: escala do dia deve estar status CLOSED.
     */
    createFromSchedule: (date: string) =>
        fetchAuth(`${CLOSURE}/${date}/from-pre`, { method: 'POST' }),

    /**
     * Atualiza fechamento (header e/ou lines).
     * Campos aceitos: header, lines, notes
     * Só aceita quando status = DRAFT
     */
    update: (id: string, data: { header?: any; lines?: any[]; notes?: string }) =>
        fetchAuth(`${CLOSURE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /**
     * Reordena linhas do fechamento.
     * order: [{ preLotRefId: string, sequence: number }]
     */
    reorderLines: (id: string, order: Array<{ preLotRefId: string; sequence: number }>) =>
        fetchAuth(`${CLOSURE}/${id}/reorder`, {
            method: 'POST',
            body: JSON.stringify({ order }),
        }),

    /**
     * Valida e fecha o Boletim SIF.
     * Valida: curral, municipio, uf em todas as linhas.
     * Retorna erro 400 com lista de produtores com dados incompletos.
     */
    close: (id: string) =>
        fetchAuth(`${CLOSURE}/${id}/close`, { method: 'POST' }),

    /**
     * Reabre fechamento (admin ou tecnico).
     * reason é obrigatório — gravado em reopenLog.
     */
    reopen: (id: string, reason: string) =>
        fetchAuth(`${CLOSURE}/${id}/reopen`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),

    /** Exporta Boletim de Abate em PDF */
    exportPdf: (id: string) =>
        fetchAuth(`${CLOSURE}/${id}/pdf`),

    /** Exporta template XLSM oficial SIF */
    exportXlsm: (id: string) =>
        fetchAuth(`${CLOSURE}/${id}/export?format=xlsm`),
};


// ════════════════════════════════════════════════════════════
// UTILITÁRIOS  (helpers locais para o front)
// ════════════════════════════════════════════════════════════

/** Converte "HH:mm" para total de minutos desde 00:00 */
export function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/** Converte total de minutos para "HH:mm" */
export function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = Math.round(minutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calcula horários de um lote com base no lote anterior e nos parâmetros da escala.
 * Replica a lógica do backend para preview instantâneo no front.
 */
export function calculateLotTimingLocal(
    lot: { boi: number; vaca: number; novilha: number; bubalino: number; touro: number },
    previousEndTime: string,
    schedule: {
        rateHeadsPerHour: number;
        breakfastTime?: string;
        breakfastDuration?: number;
        lunchTime?: string;
        lunchDuration?: number;
    }
): { startTime: string; endTime: string; durationMinutes: number; total: number } {
    const { rateHeadsPerHour = 100, breakfastTime, breakfastDuration = 15, lunchTime, lunchDuration = 70 } = schedule;
    const total = (lot.boi || 0) + (lot.vaca || 0) + (lot.novilha || 0) + (lot.bubalino || 0) + (lot.touro || 0);
    const durationMinutes = Math.ceil((total / rateHeadsPerHour) * 60);

    let startMinutes = timeToMinutes(previousEndTime);

    if (breakfastTime) {
        const bStart = timeToMinutes(breakfastTime);
        if (startMinutes >= bStart && startMinutes < bStart + breakfastDuration)
            startMinutes = bStart + breakfastDuration;
    }
    if (lunchTime) {
        const lStart = timeToMinutes(lunchTime);
        if (startMinutes >= lStart && startMinutes < lStart + lunchDuration)
            startMinutes = lStart + lunchDuration;
    }

    let endMinutes = startMinutes + durationMinutes;

    if (breakfastTime) {
        const bStart = timeToMinutes(breakfastTime);
        if (startMinutes < bStart && endMinutes > bStart) endMinutes += breakfastDuration;
    }
    if (lunchTime) {
        const lStart = timeToMinutes(lunchTime);
        if (startMinutes < lStart && endMinutes > lStart) endMinutes += lunchDuration;
    }

    return {
        total,
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes),
        durationMinutes,
    };
}

/** Formata data brasileira: "YYYY-MM-DD" → "DD/MM/YYYY" */
export function formatDateBR(date: string | Date): string {
    const d = typeof date === 'string' ? date.substring(0, 10) : date.toISOString().substring(0, 10);
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

/** Retorna "YYYY-MM-DD" de uma Date UTC */
export function toISODateString(date: Date): string {
    return date.toISOString().substring(0, 10);
}

/** Soma quantidades por categoria de um array de lotes */
export function sumCattleCategories(lots: Array<{ boi?: number; vaca?: number; novilha?: number; bubalino?: number; touro?: number }>) {
    return lots.reduce(
        (acc, lot) => ({
            boi: acc.boi + (lot.boi || 0),
            vaca: acc.vaca + (lot.vaca || 0),
            novilha: acc.novilha + (lot.novilha || 0),
            bubalino: acc.bubalino + (lot.bubalino || 0),
            touro: acc.touro + (lot.touro || 0),
            total: acc.total + (lot.boi || 0) + (lot.vaca || 0) + (lot.novilha || 0) + (lot.bubalino || 0) + (lot.touro || 0),
        }),
        { boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0, total: 0 }
    );
}
