import SlaughterPreSchedule from '../models/SlaughterPreSchedule.js';
import SlaughterSchedule from '../models/SlaughterSchedule.js';
import SlaughterLot from '../models/SlaughterLot.js';
import { generateSlaughterPDF } from '../utils/pdfGenerator.js';
import { syncClosureWithSchedule } from './closureController.js';

// @desc    Obter calendário de pré-escala
// @route   GET /api/slaughter/pre-schedule/calendar
export const getPreCalendar = async (req, res, next) => {
    try {
        const { month } = req.query; // Expects YYYY-MM
        const [year, mo] = month.split('-').map(Number);

        // Início do mês solicitado em UTC
        const start = new Date(Date.UTC(year, mo - 1, 1, 0, 0, 0));

        // Início do PRÓXIMO mês em UTC (o limite superior)
        const end = new Date(Date.UTC(year, mo, 1, 0, 0, 0));

        const schedules = await SlaughterPreSchedule.find({
            date: { $gte: start, $lt: end }
        }).select('date status totalCattle');

        res.json({ success: true, data: schedules });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter pré-escala por data
// @route   GET /api/slaughter/pre-schedule/:date
export const getPreScheduleByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        let schedule = await SlaughterPreSchedule.findOne({ date: normalizedDate });

        if (!schedule) {
            schedule = await SlaughterPreSchedule.create({
                date: normalizedDate,
                status: 'DRAFT',
                createdBy: req.user.id
            });
        }

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar pré-escala (incluindo lotes)
// @route   PUT /api/slaughter/pre-schedule/:id
export const updatePreSchedule = async (req, res, next) => {
    try {
        const schedule = await SlaughterPreSchedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ success: false, message: 'Pré-escala não encontrada' });
        if (schedule.status === 'PUBLISHED' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Somente admin pode editar escala publicada' });
        }

        const allowedFields = ['startTime', 'rateHeadsPerHour', 'lots', 'totalCattle', 'status', 'notes', 'breakfastTime', 'breakfastDuration', 'lunchTime', 'lunchDuration'];
        const updateData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

        const updated = await SlaughterPreSchedule.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Publicar pré-escala
// @route   POST /api/slaughter/pre-schedule/:id/publish
export const publishPreSchedule = async (req, res, next) => {
    try {
        const schedule = await SlaughterPreSchedule.findByIdAndUpdate(req.params.id, {
            status: 'PUBLISHED',
            publishedBy: req.user.id,
            publishedAt: new Date()
        }, { new: true });
        res.json({ success: true, data: schedule, message: 'Escala publicada com sucesso' });
    } catch (error) {
        next(error);
    }
};

// Helper to sync PreSchedule to SlaughterSchedule (used for SIF closure visibility)
async function syncToSlaughterSchedule(preSchedule, userId) {
    const normalizedDate = new Date(preSchedule.date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    let schedule = await SlaughterSchedule.findOne({ slaughterDate: normalizedDate });

    if (!schedule) {
        schedule = new SlaughterSchedule({
            slaughterDate: normalizedDate,
            startTime: preSchedule.startTime || '07:00',
            rateHeadsPerHour: preSchedule.rateHeadsPerHour || 100,
            status: preSchedule.status === 'ENVIADA' ? 'CLOSED' : 'DRAFT',
            breakfastTime: preSchedule.breakfastTime,
            breakfastDuration: preSchedule.breakfastDuration,
            lunchTime: preSchedule.lunchTime,
            lunchDuration: preSchedule.lunchDuration,
            createdBy: userId
        });
    } else {
        schedule.startTime = preSchedule.startTime || '07:00';
        schedule.rateHeadsPerHour = preSchedule.rateHeadsPerHour || 100;
        schedule.status = preSchedule.status === 'ENVIADA' ? 'CLOSED' : 'DRAFT';
        schedule.breakfastTime = preSchedule.breakfastTime;
        schedule.breakfastDuration = preSchedule.breakfastDuration;
        schedule.lunchTime = preSchedule.lunchTime;
        schedule.lunchDuration = preSchedule.lunchDuration;
    }

    await schedule.save();

    // Sync lots (clean and recreate)
    await SlaughterLot.deleteMany({ schedule: schedule._id });

    const rate = schedule.rateHeadsPerHour || 100;
    const [startHours, startMins] = (schedule.startTime || '07:00').split(':').map(Number);
    let currentTotalMinutes = startHours * 60 + startMins;

    const breakfastStart = schedule.breakfastTime ? schedule.breakfastTime.split(':').map(Number) : [8, 0];
    const breakfastStartMins = breakfastStart[0] * 60 + breakfastStart[1];
    const breakfastDur = schedule.breakfastDuration || 15;

    const lunchStart = schedule.lunchTime ? schedule.lunchTime.split(':').map(Number) : [11, 0];
    const lunchStartMins = lunchStart[0] * 60 + lunchStart[1];
    const lunchDur = schedule.lunchDuration || 70;

    let appliedBreakfast = false;
    let appliedLunch = false;

    const formatMinutes = (mins) => {
        const h = Math.floor(mins / 60) % 24;
        const m = Math.round(mins % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const newLots = preSchedule.lots.map((lot, idx) => {
        if (!appliedBreakfast && currentTotalMinutes >= breakfastStartMins) {
            currentTotalMinutes += breakfastDur;
            appliedBreakfast = true;
        }
        if (!appliedLunch && currentTotalMinutes >= lunchStartMins) {
            currentTotalMinutes += lunchDur;
            appliedLunch = true;
        }

        const lotStartTime = formatMinutes(currentTotalMinutes);
        const durationMinutes = (lot.total / rate) * 60;
        currentTotalMinutes += durationMinutes;

        if (!appliedBreakfast && currentTotalMinutes > breakfastStartMins) {
            currentTotalMinutes += breakfastDur;
            appliedBreakfast = true;
        }
        if (!appliedLunch && currentTotalMinutes > lunchStartMins) {
            currentTotalMinutes += lunchDur;
            appliedLunch = true;
        }

        const lotEndTime = formatMinutes(currentTotalMinutes);

        return {
            schedule: schedule._id,
            lotNumber: idx + 1,
            rancherName: lot.producerName,
            brokerNumber: lot.brokerCode || '-',
            boi: lot.boi || 0,
            vaca: lot.vaca || 0,
            novilha: lot.novilha || 0,
            bubalino: lot.bubalino || 0,
            touro: lot.touro || 0,
            total: lot.total,
            startTime: lotStartTime,
            durationMinutes: Math.round(durationMinutes),
            endTime: lotEndTime,
            order: idx + 1
        };
    });

    if (newLots.length > 0) {
        await SlaughterLot.insertMany(newLots);
    }

    const totals = newLots.reduce((acc, lot) => ({
        boi: acc.boi + (lot.boi || 0),
        vaca: acc.vaca + (lot.vaca || 0),
        novilha: acc.novilha + (lot.novilha || 0),
        bubalino: acc.bubalino + (lot.bubalino || 0),
        touro: acc.touro + (lot.touro || 0),
        total: acc.total + (lot.total || 0)
    }), { boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0, total: 0 });

    schedule.totalBoi = totals.boi;
    schedule.totalVaca = totals.vaca;
    schedule.totalNovilha = totals.novilha;
    schedule.totalBubalino = totals.bubalino;
    schedule.totalTouro = totals.touro;
    schedule.totalCattle = totals.total;

    if (schedule.status === 'CLOSED') {
        schedule.closedBy = userId;
        schedule.closedAt = new Date();
    } else {
        schedule.closedBy = null;
        schedule.closedAt = null;
    }

    await schedule.save();

    // Sincronizar com o fechamento SIF se houver um rascunho para esta data
    await syncClosureWithSchedule(schedule._id);
}

// @desc    Salvar pré-escala em lote (Bulk)
// @route   POST /api/slaughter-pre/bulk
export const bulkSavePreSchedule = async (req, res, next) => {
    try {
        const {
            date,
            startTime,
            rateHeadsPerHour,
            lots,
            notes,
            requestId,
            breakfastTime,
            breakfastDuration,
            lunchTime,
            lunchDuration
        } = req.body;

        if (!date || !lots) {
            return res.status(400).json({ success: false, message: 'Dados insuficientes para processar a pré-escala' });
        }

        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // 1. Verificar Idempotência (requestId)
        let schedule = await SlaughterPreSchedule.findOne({ date: normalizedDate });

        if (schedule && schedule.lastRequestId === requestId) {
            console.log(`[IDEMPOTENCIA] Ignorando duplicidade para requestId: ${requestId}`);
            return res.json({ success: true, data: schedule, message: 'Requisição processada anteriormente (idempotência)' });
        }

        const incomingStatus = req.body.status || 'ENVIADA';
        console.log(`[DEBUG] Controller bulkSavePreSchedule - Data: ${date}, Status Recebido: ${incomingStatus}`);

        // 2. Trava de Edição: Se estiver ENVIADA e não estiver tentando mudar status (reabrir/publicar), bloqueia
        if (schedule && (schedule.status === 'ENVIADA' || schedule.status === 'PUBLISHED')) {
            // Se o status incoming for o mesmo que o atual, não permite salvar alterações nos lotes
            if (incomingStatus === schedule.status) {
                return res.status(403).json({ success: false, message: 'Não é possível editar uma escala fechada/publicada. Reabra-a primeiro.' });
            }
        }

        // 3. Calcular totais e preparar lotes
        let totalCattle = lots.reduce((sum, lot) => sum + (Number(lot.boi) || 0) + (Number(lot.vaca) || 0) + (Number(lot.novilha) || 0) + (Number(lot.bubalino) || 0) + (Number(lot.touro) || 0), 0);

        // Garantir que cada lote tenha seu total individual e preLotRefId
        const updatedLots = lots.map(lot => ({
            ...lot,
            total: (Number(lot.boi) || 0) + (Number(lot.vaca) || 0) + (Number(lot.novilha) || 0) + (Number(lot.bubalino) || 0) + (Number(lot.touro) || 0)
        }));

        // 4. Cálculo de Previsão de Horário
        const rateHeads = rateHeadsPerHour || 100;
        const totalDurationHours = totalCattle / rateHeads;

        let endTime = '00:00';
        if (startTime) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const totalStartMinutes = hours * 60 + minutes;
            const totalEndMinutes = totalStartMinutes + (totalDurationHours * 60);

            const endHrs = Math.floor(totalEndMinutes / 60) % 24;
            const endMins = Math.round(totalEndMinutes % 60);
            endTime = `${String(endHrs).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        }

        // 5. Preparar dados
        const updateData = {
            startTime,
            rateHeadsPerHour: rateHeads,
            lots: updatedLots,
            totalCattle,
            status: incomingStatus,
            lastRequestId: requestId,
            updatedBy: req.user.id,
            breakfastTime,
            breakfastDuration,
            lunchTime,
            lunchDuration
        };

        if (!schedule) {
            updateData.date = normalizedDate;
            updateData.createdBy = req.user.id;
            schedule = new SlaughterPreSchedule(updateData);
            await schedule.save();
        } else {
            schedule = await SlaughterPreSchedule.findOneAndUpdate(
                { date: normalizedDate },
                { $set: updateData },
                { new: true, runValidators: true }
            );
        }

        // Sincronizar com a escala de abate (SlaughterSchedule) para visibilidade no fechamento SIF
        try {
            await syncToSlaughterSchedule(schedule, req.user.id);
        } catch (syncError) {
            console.error('[SYNC_ERROR] Erro ao sincronizar com escala de abate:', syncError);
            // Lançar erro para garantir que a transação de "fechamento" não pareça completa se a sync falhar
            throw new Error(`Pré-escala salva, mas falhou ao sincronizar com a escala oficial: ${syncError.message}`);
        }

        console.log(`[BULK_SAVE] Pré-escala salva para data ${date}. Total: ${totalCattle} cabeças. Status: ${updateData.status}`);

        res.json({
            success: true,
            data: schedule,
            metrics: {
                totalCattle,
                totalDurationHours,
                estimatedEndTime: endTime
            },
            message: updateData.status === 'DRAFT' ? 'Rascunho salvo/Lote reaberto com sucesso' : 'Pré-escala fechada com sucesso'
        });
    } catch (error) {
        console.error('[ERRO_BULK_SAVE]', error);
        res.status(400).json({ success: false, message: error.message || 'Erro ao processar salvamento da pré-escala' });
    }
};

// @desc    Exportar pré-escala para PDF
// @route   GET /api/slaughter-pre/:id/pdf
export const exportPreSchedulePdf = async (req, res, next) => {
    try {
        const schedule = await SlaughterPreSchedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ success: false, message: 'Pré-escala não encontrada' });

        // Mapear SlaughterPreSchedule para o formato esperado pelo generateSlaughterPDF
        // Calcular horários individuais de cada lote
        const rate = schedule.rateHeadsPerHour || 100;
        const [startHours, startMins] = (schedule.startTime || '07:00').split(':').map(Number);
        let currentTotalMinutes = startHours * 60 + startMins;

        const breakfastStart = schedule.breakfastTime ? schedule.breakfastTime.split(':').map(Number) : [8, 0];
        const breakfastStartMins = breakfastStart[0] * 60 + breakfastStart[1];
        const breakfastDur = schedule.breakfastDuration || 15;

        const lunchStart = schedule.lunchTime ? schedule.lunchTime.split(':').map(Number) : [11, 0];
        const lunchStartMins = lunchStart[0] * 60 + lunchStart[1];
        const lunchDur = schedule.lunchDuration || 70;

        let appliedBreakfast = false;
        let appliedLunch = false;

        const formatMinutes = (mins) => {
            const h = Math.floor(mins / 60) % 24;
            const m = Math.round(mins % 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        const mappedLots = schedule.lots.map((lot, idx) => {
            // Verificar intervalos ANTES de começar o lote
            if (!appliedBreakfast && currentTotalMinutes >= breakfastStartMins) {
                currentTotalMinutes += breakfastDur;
                appliedBreakfast = true;
            }
            if (!appliedLunch && currentTotalMinutes >= lunchStartMins) {
                currentTotalMinutes += lunchDur;
                appliedLunch = true;
            }

            const lotStartTime = formatMinutes(currentTotalMinutes);
            const durationMinutes = (lot.total / rate) * 60;

            // O lote termina após sua duração
            currentTotalMinutes += durationMinutes;

            // Verificar se o intervalo aconteceu DURANTE o lote (simplificado: se cruzou a marca do intervalo, adiciona o tempo)
            if (!appliedBreakfast && currentTotalMinutes > breakfastStartMins) {
                currentTotalMinutes += breakfastDur;
                appliedBreakfast = true;
            }
            if (!appliedLunch && currentTotalMinutes > lunchStartMins) {
                currentTotalMinutes += lunchDur;
                appliedLunch = true;
            }

            const lotEndTime = formatMinutes(currentTotalMinutes);

            return {
                lotNumber: idx + 1,
                rancherName: lot.producerName,
                brokerNumber: lot.brokerCode || '-',
                boi: lot.boi,
                vaca: lot.vaca,
                novilha: lot.novilha,
                bubalino: lot.bubalino,
                touro: lot.touro,
                total: lot.total,
                startTime: lotStartTime,
                endTime: lotEndTime
            };
        });

        const mappedData = {
            slaughterDate: schedule.date,
            startTime: schedule.startTime,
            totalCattle: schedule.totalCattle,
            totalBoi: schedule.lots.reduce((s, l) => s + (l.boi || 0), 0),
            totalVaca: schedule.lots.reduce((s, l) => s + (l.vaca || 0), 0),
            totalNovilha: schedule.lots.reduce((s, l) => s + (l.novilha || 0), 0),
            totalBubalino: schedule.lots.reduce((s, l) => s + (l.bubalino || 0), 0),
            totalTouro: schedule.lots.reduce((s, l) => s + (l.touro || 0), 0),
            lots: mappedLots
        };

        const pdfUrl = await generateSlaughterPDF(mappedData);
        res.json({ success: true, pdfUrl });
    } catch (error) {
        console.error('[ERRO_EXPORT_PDF]', error);
        next(error);
    }
};
// @desc    Reordenar lotes da pré-escala
// @route   POST /api/slaughter/pre-schedule/:id/reorder
export const reorderLots = async (req, res, next) => {
    try {
        const { lotIds } = req.body; // Array de preLotRefId na nova ordem
        const schedule = await SlaughterPreSchedule.findById(req.params.id);

        if (!schedule) return res.status(404).json({ success: false, message: 'Pré-escala não encontrada' });
        if (schedule.status === 'PUBLISHED' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Somente admin pode reordenar escala publicada' });
        }

        const reorderedLots = [];
        lotIds.forEach(refId => {
            const lot = schedule.lots.find(l => l.preLotRefId === refId);
            if (lot) reorderedLots.push(lot);
        });

        // Adicionar lotes que possam ter ficado de fora (segurança)
        schedule.lots.forEach(lot => {
            if (!lotIds.includes(lot.preLotRefId)) {
                reorderedLots.push(lot);
            }
        });

        schedule.lots = reorderedLots;
        await schedule.save();

        // Sincronizar com a escala de abate
        await syncToSlaughterSchedule(schedule, req.user.id);

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};
