import DeboningSchedule from '../models/DeboningSchedule.js';
import DeboningLot from '../models/DeboningLot.js';
import SlaughterSchedule from '../models/SlaughterSchedule.js';
import SlaughterLot from '../models/SlaughterLot.js';

// ── Helpers ──────────────────────────────────────────────

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function calculateLotTiming(lot, previousEndTime, schedule) {
    const { targetCarcassesPerHour = 50, breakfastTime, breakfastDuration, lunchTime, lunchDuration } = schedule;

    const total = (lot.boi || 0) + (lot.vaca || 0) + (lot.novilha || 0) + (lot.bubalino || 0) + (lot.touro || 0);
    const durationMinutes = Math.ceil((total / targetCarcassesPerHour) * 60);

    let startMinutes = timeToMinutes(previousEndTime);

    // Verificar café
    if (breakfastTime && breakfastDuration) {
        const breakStart = timeToMinutes(breakfastTime);
        if (startMinutes >= breakStart && startMinutes < breakStart + breakfastDuration) {
            startMinutes = breakStart + breakfastDuration;
        }
    }

    // Verificar almoço
    if (lunchTime && lunchDuration) {
        const breakStart = timeToMinutes(lunchTime);
        if (startMinutes >= breakStart && startMinutes < breakStart + lunchDuration) {
            startMinutes = breakStart + lunchDuration;
        }
    }

    let endMinutes = startMinutes + durationMinutes;

    // Re-checar se intervalos acontecem DURANTE a execução
    if (breakfastTime && breakfastDuration) {
        const breakStart = timeToMinutes(breakfastTime);
        if (startMinutes < breakStart && endMinutes > breakStart) {
            endMinutes += breakfastDuration;
        }
    }

    if (lunchTime && lunchDuration) {
        const breakStart = timeToMinutes(lunchTime);
        if (startMinutes < breakStart && endMinutes > breakStart) {
            endMinutes += lunchDuration;
        }
    }

    return {
        totalCarcassas: total,
        startTime: minutesToTime(startMinutes),
        durationMinutes,
        endTime: minutesToTime(endMinutes)
    };
}

async function recalculateAllLots(scheduleId) {
    const schedule = await DeboningSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    const lots = await DeboningLot.find({ schedule: scheduleId }).sort('order');

    let previousEndTime = schedule.startTime;

    // Primeiro: remover lotNumbers para evitar conflito de índice único
    for (let i = 0; i < lots.length; i++) {
        await DeboningLot.findByIdAndUpdate(lots[i]._id, { lotNumber: -(i + 5000) });
    }

    // Segundo: atribuir números e calcular horários
    for (let i = 0; i < lots.length; i++) {
        const lot = lots[i];
        const timing = calculateLotTiming(lot, previousEndTime, schedule);

        await DeboningLot.findByIdAndUpdate(lot._id, {
            lotNumber: i + 1,
            order: i + 1,
            startTime: timing.startTime,
            durationMinutes: timing.durationMinutes,
            endTime: timing.endTime,
            totalCarcassas: timing.totalCarcassas
        });

        previousEndTime = timing.endTime;
    }

    await updateScheduleTotals(scheduleId);
}

async function updateScheduleTotals(scheduleId) {
    const lots = await DeboningLot.find({ schedule: scheduleId });

    const totals = lots.reduce((acc, lot) => ({
        boi: acc.boi + (lot.boi || 0),
        vaca: acc.vaca + (lot.vaca || 0),
        novilha: acc.novilha + (lot.novilha || 0),
        bubalino: acc.bubalino + (lot.bubalino || 0),
        touro: acc.touro + (lot.touro || 0),
        totalCarcassas: acc.totalCarcassas + (lot.totalCarcassas || 0),
        traseiro: acc.traseiro + (lot.production?.traseiro || 0),
        dianteiro: acc.dianteiro + (lot.production?.dianteiro || 0),
        ponta: acc.ponta + (lot.production?.pontaAgulha || 0),
        recortes: acc.recortes + (lot.production?.recortes || 0),
        osso: acc.osso + (lot.production?.osso || 0),
        sebo: acc.sebo + (lot.production?.sebo || 0),
        totalKg: acc.totalKg + (lot.totalProduzidoKg || 0)
    }), { boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0, totalCarcassas: 0, traseiro: 0, dianteiro: 0, ponta: 0, recortes: 0, osso: 0, sebo: 0, totalKg: 0 });

    await DeboningSchedule.findByIdAndUpdate(scheduleId, {
        totalBoi: totals.boi,
        totalVaca: totals.vaca,
        totalNovilha: totals.novilha,
        totalBubalino: totals.bubalino,
        totalTouro: totals.touro,
        totalCarcassas: totals.totalCarcassas,
        totalTraseiro: totals.traseiro,
        totalDianteiro: totals.dianteiro,
        totalPonta: totals.ponta,
        totalRecortes: totals.recortes,
        totalOsso: totals.osso,
        totalSebo: totals.sebo,
        totalProduzidoKg: totals.totalKg
    });
}

// ── Endpoints ────────────────────────────────────────────

// @desc    Obter calendário mensal
// @route   GET /api/deboning/calendar?month=2025-02
export const getCalendar = async (req, res, next) => {
    try {
        const { month } = req.query;

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de mês inválido. Use YYYY-MM'
            });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
        const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

        const schedules = await DeboningSchedule.find({
            scheduleDate: { $gte: startDate, $lte: endDate }
        }).select('scheduleDate status totalCarcassas totalBoi totalVaca totalNovilha totalBubalino totalTouro totalProduzidoKg');

        const calendar = schedules.map(s => ({
            date: s.scheduleDate.toISOString().split('T')[0],
            status: s.status,
            totalCarcassas: s.totalCarcassas,
            totalBoi: s.totalBoi || 0,
            totalVaca: s.totalVaca || 0,
            totalNovilha: s.totalNovilha || 0,
            totalBubalino: s.totalBubalino || 0,
            totalTouro: s.totalTouro || 0,
            totalProduzidoKg: s.totalProduzidoKg || 0
        }));

        // Totais do mês (só escalas CLOSED)
        const closed = schedules.filter(s => s.status === 'CLOSED');
        const monthlySummary = {
            totalBoi: closed.reduce((s, x) => s + (x.totalBoi || 0), 0),
            totalVaca: closed.reduce((s, x) => s + (x.totalVaca || 0), 0),
            totalNovilha: closed.reduce((s, x) => s + (x.totalNovilha || 0), 0),
            totalBubalino: closed.reduce((s, x) => s + (x.totalBubalino || 0), 0),
            totalTouro: closed.reduce((s, x) => s + (x.totalTouro || 0), 0),
            totalCarcassas: closed.reduce((s, x) => s + (x.totalCarcassas || 0), 0),
            totalProduzidoKg: closed.reduce((s, x) => s + (x.totalProduzidoKg || 0), 0),
            closedDays: closed.length
        };

        res.json({ success: true, data: calendar, monthlySummary });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter escala por data
// @route   GET /api/deboning/schedules/:date
export const getScheduleByDate = async (req, res, next) => {
    try {
        const { date } = req.params;

        const schedule = await DeboningSchedule.findOne({
            scheduleDate: new Date(date)
        }).populate({
            path: 'lots',
            populate: { path: 'slaughterLot', select: 'lotNumber rancherName brokerNumber' }
        }).populate('slaughterSchedule', 'slaughterDate status totalCattle');

        if (!schedule) {
            // Criar nova escala DRAFT
            const newSchedule = await DeboningSchedule.create({
                scheduleDate: new Date(date),
                startTime: '06:00',
                createdBy: req.user.id
            });

            return res.json({
                success: true,
                data: { ...newSchedule.toObject(), lots: [] }
            });
        }

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar escala
// @route   PUT /api/deboning/schedules/:id
export const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await DeboningSchedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Programação não encontrada' });
        }

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Programação fechada não pode ser editada' });
        }

        const recalculateFields = ['startTime', 'targetCarcassesPerHour', 'breakfastTime', 'breakfastDuration', 'lunchTime', 'lunchDuration'];
        const shouldRecalculate = recalculateFields.some(f => req.body[f] !== undefined && req.body[f] !== schedule[f]);

        const updated = await DeboningSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (shouldRecalculate) {
            await recalculateAllLots(req.params.id);
            const reloaded = await DeboningSchedule.findById(req.params.id).populate({
                path: 'lots',
                populate: { path: 'slaughterLot', select: 'lotNumber rancherName brokerNumber' }
            });
            return res.json({ success: true, data: reloaded });
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Importar lotes do abate
// @route   POST /api/deboning/schedules/:scheduleId/import-slaughter/:slaughterDate
export const importFromSlaughter = async (req, res, next) => {
    try {
        const { scheduleId, slaughterDate } = req.params;

        const deboningSchedule = await DeboningSchedule.findById(scheduleId);
        if (!deboningSchedule) {
            return res.status(404).json({ success: false, message: 'Programação de desossa não encontrada' });
        }

        if (deboningSchedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Programação fechada não pode ser editada' });
        }

        // Buscar a escala de abate
        const slaughterSchedule = await SlaughterSchedule.findOne({
            slaughterDate: new Date(slaughterDate)
        });

        if (!slaughterSchedule) {
            return res.status(404).json({ success: false, message: 'Escala de abate não encontrada para esta data' });
        }

        const slaughterLots = await SlaughterLot.find({ schedule: slaughterSchedule._id }).sort('order');

        if (slaughterLots.length === 0) {
            return res.status(400).json({ success: false, message: 'Escala de abate sem lotes' });
        }

        // Vincular escala de abate
        deboningSchedule.slaughterSchedule = slaughterSchedule._id;
        await deboningSchedule.save();

        // Obter último lote existente
        const lastLot = await DeboningLot.findOne({ schedule: scheduleId }).sort('-order');
        let currentOrder = (lastLot?.order || 0);
        let currentLotNumber = (lastLot?.lotNumber || 0);
        let previousEndTime = lastLot?.endTime || deboningSchedule.startTime;

        const createdLots = [];

        for (const sLot of slaughterLots) {
            currentOrder++;
            currentLotNumber++;

            const lotData = {
                boi: sLot.boi || 0,
                vaca: sLot.vaca || 0,
                novilha: sLot.novilha || 0,
                bubalino: sLot.bubalino || 0,
                touro: sLot.touro || 0
            };

            const timing = calculateLotTiming(lotData, previousEndTime, deboningSchedule);

            const newLot = await DeboningLot.create({
                schedule: scheduleId,
                lotNumber: currentLotNumber,
                slaughterLot: sLot._id,
                origin: sLot.rancherName,
                sifNumber: sLot.brokerNumber,
                ...lotData,
                totalCarcassas: timing.totalCarcassas,
                startTime: timing.startTime,
                durationMinutes: timing.durationMinutes,
                endTime: timing.endTime,
                order: currentOrder
            });

            createdLots.push(newLot);
            previousEndTime = timing.endTime;
        }

        await updateScheduleTotals(scheduleId);

        const reloaded = await DeboningSchedule.findById(scheduleId).populate({
            path: 'lots',
            populate: { path: 'slaughterLot', select: 'lotNumber rancherName brokerNumber' }
        }).populate('slaughterSchedule', 'slaughterDate status totalCattle');

        res.status(201).json({
            success: true,
            data: reloaded,
            message: `${createdLots.length} lotes importados do abate`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Buscar escalas de abate disponíveis para importação
// @route   GET /api/deboning/available-slaughter?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getAvailableSlaughter = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const query = {};

        if (from) query.slaughterDate = { $gte: new Date(from) };
        if (to) {
            query.slaughterDate = query.slaughterDate || {};
            query.slaughterDate.$lte = new Date(to);
        }

        // Buscar escalas de abate fechadas
        query.status = 'CLOSED';

        const schedules = await SlaughterSchedule.find(query)
            .select('slaughterDate totalCattle totalBoi totalVaca totalNovilha totalBubalino totalTouro')
            .sort('-slaughterDate')
            .limit(30);

        res.json({ success: true, data: schedules });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar lote
// @route   POST /api/deboning/schedules/:scheduleId/lots
export const createLot = async (req, res, next) => {
    try {
        const schedule = await DeboningSchedule.findById(req.params.scheduleId);

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Programação não encontrada' });
        }

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Não é possível adicionar lotes em programação fechada' });
        }

        const lastLot = await DeboningLot.findOne({ schedule: schedule._id }).sort('-order');
        const order = (lastLot?.order || 0) + 1;
        const lotNumber = (lastLot?.lotNumber || 0) + 1;

        const timing = calculateLotTiming(req.body, lastLot?.endTime || schedule.startTime, schedule);

        const lot = await DeboningLot.create({
            ...req.body,
            schedule: schedule._id,
            order,
            lotNumber,
            ...timing
        });

        await updateScheduleTotals(schedule._id);

        const populated = await DeboningLot.findById(lot._id)
            .populate('slaughterLot', 'lotNumber rancherName brokerNumber');

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar lote
// @route   PUT /api/deboning/lots/:id
export const updateLot = async (req, res, next) => {
    try {
        const lot = await DeboningLot.findById(req.params.id);

        if (!lot) {
            return res.status(404).json({ success: false, message: 'Lote não encontrado' });
        }

        const schedule = await DeboningSchedule.findById(lot.schedule);

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Não é possível editar lote de programação fechada' });
        }

        await DeboningLot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        // Recalcular horários e totais
        await recalculateAllLots(lot.schedule);

        const updated = await DeboningLot.findById(req.params.id)
            .populate('slaughterLot', 'lotNumber rancherName brokerNumber');

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Registrar produção do lote
// @route   PUT /api/deboning/lots/:id/production
export const updateLotProduction = async (req, res, next) => {
    try {
        const lot = await DeboningLot.findById(req.params.id);

        if (!lot) {
            return res.status(404).json({ success: false, message: 'Lote não encontrado' });
        }

        const schedule = await DeboningSchedule.findById(lot.schedule);

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Programação fechada' });
        }

        const { production, lotStatus } = req.body;

        const updateData = {};
        if (production) {
            updateData.production = { ...lot.production?.toObject?.() || lot.production || {}, ...production };
            // Calcular total
            const p = updateData.production;
            updateData.totalProduzidoKg = (p.traseiro || 0) + (p.dianteiro || 0) + (p.pontaAgulha || 0) +
                (p.recortes || 0) + (p.osso || 0) + (p.sebo || 0) + (p.miudos || 0) + (p.outros || 0);
        }
        if (lotStatus) {
            updateData.lotStatus = lotStatus;
        }

        const updated = await DeboningLot.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
            .populate('slaughterLot', 'lotNumber rancherName brokerNumber');

        await updateScheduleTotals(lot.schedule);

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Excluir lote
// @route   DELETE /api/deboning/lots/:id
export const deleteLot = async (req, res, next) => {
    try {
        const lot = await DeboningLot.findById(req.params.id);

        if (!lot) {
            return res.status(404).json({ success: false, message: 'Lote não encontrado' });
        }

        const schedule = await DeboningSchedule.findById(lot.schedule);

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Não é possível excluir lote de programação fechada' });
        }

        await DeboningLot.findByIdAndDelete(req.params.id);
        await recalculateAllLots(lot.schedule);

        res.json({ success: true, message: 'Lote excluído com sucesso' });
    } catch (error) {
        next(error);
    }
};

// @desc    Recalcular horários
// @route   POST /api/deboning/schedules/:id/recalculate
export const recalculateLots = async (req, res, next) => {
    try {
        await recalculateAllLots(req.params.id);

        const schedule = await DeboningSchedule.findById(req.params.id).populate({
            path: 'lots',
            populate: { path: 'slaughterLot', select: 'lotNumber rancherName brokerNumber' }
        });

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Reordenar lotes
// @route   POST /api/deboning/schedules/:id/reorder
export const reorderLots = async (req, res, next) => {
    try {
        const { lotIds } = req.body;

        if (!lotIds || !Array.isArray(lotIds)) {
            return res.status(400).json({ success: false, message: 'lotIds é obrigatório e deve ser um array' });
        }

        const promises = lotIds.map((id, index) => DeboningLot.findByIdAndUpdate(id, { order: index + 1 }));
        await Promise.all(promises);

        await recalculateAllLots(req.params.id);

        const schedule = await DeboningSchedule.findById(req.params.id).populate({
            path: 'lots',
            populate: { path: 'slaughterLot', select: 'lotNumber rancherName brokerNumber' }
        });

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Iniciar produção
// @route   POST /api/deboning/schedules/:id/start
export const startSchedule = async (req, res, next) => {
    try {
        const schedule = await DeboningSchedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Programação não encontrada' });
        }

        if (schedule.status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: 'Apenas programações em rascunho podem ser iniciadas' });
        }

        const lots = await DeboningLot.find({ schedule: schedule._id });
        if (lots.length === 0) {
            return res.status(400).json({ success: false, message: 'Programação sem lotes não pode ser iniciada' });
        }

        schedule.status = 'IN_PROGRESS';
        schedule.startedBy = req.user.id;
        schedule.startedAt = new Date();
        await schedule.save();

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Fechar programação
// @route   POST /api/deboning/schedules/:id/close
export const closeSchedule = async (req, res, next) => {
    try {
        const schedule = await DeboningSchedule.findById(req.params.id).populate({
            path: 'lots',
            populate: { path: 'slaughterLot', select: 'lotNumber rancherName brokerNumber' }
        });

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Programação não encontrada' });
        }

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Programação já está fechada' });
        }

        if (!schedule.lots || schedule.lots.length === 0) {
            return res.status(400).json({ success: false, message: 'Programação vazia não pode ser fechada' });
        }

        await recalculateAllLots(schedule._id);

        schedule.status = 'CLOSED';
        schedule.closedBy = req.user.id;
        schedule.closedAt = new Date();
        await schedule.save();

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Reabrir programação
// @route   POST /api/deboning/schedules/:id/reopen
export const reopenSchedule = async (req, res, next) => {
    try {
        const schedule = await DeboningSchedule.findByIdAndUpdate(
            req.params.id,
            { status: 'DRAFT', closedBy: null, closedAt: null, pdfUrl: null },
            { new: true }
        );

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Programação não encontrada' });
        }

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter resumo de produção
// @route   GET /api/deboning/schedules/:id/production-summary
export const getProductionSummary = async (req, res, next) => {
    try {
        const schedule = await DeboningSchedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Programação não encontrada' });
        }

        const lots = await DeboningLot.find({ schedule: req.params.id }).sort('order');

        const byDestino = {};
        const byStatus = { PENDENTE: 0, EM_PROCESSO: 0, CONCLUIDO: 0 };

        lots.forEach(lot => {
            // Por destino
            const dest = lot.destino || 'MERCADO_INTERNO';
            if (!byDestino[dest]) {
                byDestino[dest] = { carcassas: 0, produzidoKg: 0 };
            }
            byDestino[dest].carcassas += lot.totalCarcassas || 0;
            byDestino[dest].produzidoKg += lot.totalProduzidoKg || 0;

            // Por status
            byStatus[lot.lotStatus || 'PENDENTE']++;
        });

        // Rendimento médio
        const pesoTotalEstimado = lots.reduce((sum, l) => sum + ((l.totalCarcassas || 0) * (l.pesoMedioCarcassa || 250)), 0);
        const rendimento = pesoTotalEstimado > 0 ? ((schedule.totalProduzidoKg / pesoTotalEstimado) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                totalLots: lots.length,
                byDestino,
                byStatus,
                rendimentoPercent: rendimento,
                pesoTotalEstimado,
                totalProduzidoKg: schedule.totalProduzidoKg,
                production: {
                    traseiro: schedule.totalTraseiro,
                    dianteiro: schedule.totalDianteiro,
                    ponta: schedule.totalPonta,
                    recortes: schedule.totalRecortes,
                    osso: schedule.totalOsso,
                    sebo: schedule.totalSebo
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
