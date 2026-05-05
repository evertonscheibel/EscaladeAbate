import SlaughterSchedule from '../models/SlaughterSchedule.js';
import SlaughterLot from '../models/SlaughterLot.js';
import { generateSlaughterPDF } from '../utils/pdfGenerator.js';
import { createSlaughterSnapshot } from '../services/slaughterVersionService.js';
import { syncClosureWithSchedule } from './closureController.js';


// Função auxiliar: converter HH:mm para minutos totais desde 00:00
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Função auxiliar: converter minutos totais para HH:mm
function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Função auxiliar: calcular horários
function calculateLotTiming(lot, previousEndTime, schedule) {
    const { rateHeadsPerHour = 100, breakfastTime, breakfastDuration, lunchTime, lunchDuration } = schedule;

    const total = (lot.boi || 0) + (lot.vaca || 0) + (lot.novilha || 0) + (lot.bubalino || 0) + (lot.touro || 0);
    const durationMinutes = Math.ceil((total / rateHeadsPerHour) * 60);

    let startMinutes = timeToMinutes(previousEndTime);

    // Verificar se cruzou o horário de café
    if (breakfastTime && breakfastDuration) {
        const breakStart = timeToMinutes(breakfastTime);
        if (startMinutes >= breakStart && startMinutes < breakStart + breakfastDuration) {
            // Se o lote começaria durante o café, empurra para o fim do café
            startMinutes = breakStart + breakfastDuration;
        } else if (startMinutes < breakStart && (startMinutes + durationMinutes) > breakStart) {
            // Se o café acontece durante o abate do lote, adiciona a duração do café
            // startMinutes = startMinutes; // mantém o início
            // Mas o fim será empurrado
        }
    }

    // Verificar se cruzou o horário de almoço
    if (lunchTime && lunchDuration) {
        const breakStart = timeToMinutes(lunchTime);
        if (startMinutes >= breakStart && startMinutes < breakStart + lunchDuration) {
            startMinutes = breakStart + lunchDuration;
        }
    }

    let endMinutes = startMinutes + durationMinutes;

    // Re-checar se o café/almoço acontece DURANTE a execução do lote
    // Nota: Esta é uma abordagem simplificada onde os intervalos são inseridos ENTRE lotes
    // ou aumentam a duração do lote se cruzarem.
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
        total,
        startTime: minutesToTime(startMinutes),
        durationMinutes,
        endTime: minutesToTime(endMinutes)
    };
}

// @desc    Obter calendário mensal
// @route   GET /api/slaughter/calendar?month=2025-02
export const getCalendar = async (req, res, next) => {
    try {
        const { month } = req.query; // "YYYY-MM"

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de mês inválido. Use YYYY-MM'
            });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
        const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

        const schedules = await SlaughterSchedule.find({
            slaughterDate: {
                $gte: startDate,
                $lte: endDate
            }
        }).select('slaughterDate status totalCattle totalBoi totalVaca totalNovilha totalBubalino totalTouro');

        const calendar = schedules.map(s => ({
            date: s.slaughterDate.toISOString().split('T')[0],
            status: s.status,
            totalCattle: s.totalCattle,
            totalBoi: s.totalBoi || 0,
            totalVaca: s.totalVaca || 0,
            totalNovilha: s.totalNovilha || 0,
            totalBubalino: s.totalBubalino || 0,
            totalTouro: s.totalTouro || 0
        }));

        // Calcular totais do mês apenas de escalas FECHADAS
        const closedSchedules = schedules.filter(s => s.status === 'CLOSED');
        const monthlySummary = {
            totalBoi: closedSchedules.reduce((sum, s) => sum + (s.totalBoi || 0), 0),
            totalVaca: closedSchedules.reduce((sum, s) => sum + (s.totalVaca || 0), 0),
            totalNovilha: closedSchedules.reduce((sum, s) => sum + (s.totalNovilha || 0), 0),
            totalBubalino: closedSchedules.reduce((sum, s) => sum + (s.totalBubalino || 0), 0),
            totalTouro: closedSchedules.reduce((sum, s) => sum + (s.totalTouro || 0), 0),
            totalCattle: closedSchedules.reduce((sum, s) => sum + (s.totalCattle || 0), 0),
            closedDays: closedSchedules.length
        };

        res.json({
            success: true,
            data: calendar,
            monthlySummary
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter escala por data
// @route   GET /api/slaughter/schedules/:date
export const getScheduleByDate = async (req, res, next) => {
    try {
        const { date } = req.params; // "YYYY-MM-DD"

        const schedule = await SlaughterSchedule.findOne({
            slaughterDate: new Date(date)
        }).populate({
            path: 'lots',
            populate: { path: 'rancher', select: 'name cpfCnpj' }
        });

        if (!schedule) {
            // Criar nova escala em DRAFT
            const newSchedule = await SlaughterSchedule.create({
                slaughterDate: new Date(date),
                startTime: '07:00',
                createdBy: req.user.id
            });

            return res.json({
                success: true,
                data: {
                    ...newSchedule.toObject(),
                    lots: []
                }
            });
        }

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar escala
// @route   PUT /api/slaughter/schedules/:id
export const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await SlaughterSchedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Escala não encontrada'
            });
        }

        /* 
        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Escala fechada não pode ser editada'
            });
        }
        */

        // Campos que exigem recálculo dos horários dos lotes
        const recalculateFields = [
            'startTime',
            'rateHeadsPerHour',
            'breakfastTime',
            'breakfastDuration',
            'lunchTime',
            'lunchDuration'
        ];

        const shouldRecalculate = recalculateFields.some(field =>
            req.body[field] !== undefined && req.body[field] !== schedule[field]
        );

        const updated = await SlaughterSchedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Criar snapshot para auditoria SIF se a escala estiver ativa ou fechada
        await createSlaughterSnapshot({
            resourceId: schedule._id,
            resourceType: 'SlaughterSchedule',
            data: updated.toObject(),
            user: req.user,
            changeReason: req.body.changeReason || 'Alteração de parâmetros da escala',
            req
        });

        if (shouldRecalculate) {
            await recalculateAllLots(req.params.id);
            // Buscar novamente para retornar os dados atualizados (incluindo totais se mudaram)
            const reloaded = await SlaughterSchedule.findById(req.params.id).populate({
                path: 'lots',
                populate: { path: 'rancher', select: 'name cpfCnpj' }
            });

            return res.json({
                success: true,
                data: reloaded
            });
        }

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar lote
// @route   POST /api/slaughter/schedules/:scheduleId/lots
export const createLot = async (req, res, next) => {
    try {
        const schedule = await SlaughterSchedule.findById(req.params.scheduleId);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Escala não encontrada'
            });
        }

        /*
        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível adicionar lotes em escala fechada'
            });
        }
        */

        // Calcular ordem
        const lastLot = await SlaughterLot.findOne({ schedule: schedule._id }).sort('-order');
        const order = (lastLot?.order || 0) + 1;
        const lotNumber = (lastLot?.lotNumber || 0) + 1;

        // Calcular horários
        const timing = calculateLotTiming(req.body, lastLot?.endTime || schedule.startTime, schedule);

        const lot = await SlaughterLot.create({
            ...req.body,
            schedule: schedule._id,
            order,
            lotNumber,
            ...timing
        });

        // Atualizar totais da escala
        await updateScheduleTotals(schedule._id);

        const populated = await SlaughterLot.findById(lot._id)
            .populate('rancher', 'name cpfCnpj');

        res.status(201).json({
            success: true,
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar lote
// @route   PUT /api/slaughter/lots/:id
export const updateLot = async (req, res, next) => {
    try {
        const lot = await SlaughterLot.findById(req.params.id);

        if (!lot) {
            return res.status(404).json({
                success: false,
                message: 'Lote não encontrado'
            });
        }

        const schedule = await SlaughterSchedule.findById(lot.schedule);

        /*
        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível editar lote de escala fechada'
            });
        }
        */

        // Atualizar lote
        const updated = await SlaughterLot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('rancher', 'name cpfCnpj');

        // Criar snapshot para auditoria SIF
        await createSlaughterSnapshot({
            resourceId: lot._id,
            resourceType: 'SlaughterLot',
            data: updated.toObject(),
            user: req.user,
            changeReason: req.body.changeReason || 'Alteração de dados do lote',
            req
        });

        // Recalcular todos os horários
        await recalculateAllLots(lot.schedule);

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Excluir lote
// @route   DELETE /api/slaughter/lots/:id
export const deleteLot = async (req, res, next) => {
    try {
        const lot = await SlaughterLot.findById(req.params.id);

        if (!lot) {
            return res.status(404).json({
                success: false,
                message: 'Lote não encontrado'
            });
        }

        const schedule = await SlaughterSchedule.findById(lot.schedule);

        /*
        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir lote de escala fechada'
            });
        }
        */

        await lot.softDelete(req.user.id);

        // Recalcular
        await recalculateAllLots(lot.schedule);

        res.json({
            success: true,
            message: 'Lote excluído com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Recalcular horários
// @route   POST /api/slaughter/schedules/:id/recalculate
export const recalculateLots = async (req, res, next) => {
    try {
        await recalculateAllLots(req.params.id);

        const schedule = await SlaughterSchedule.findById(req.params.id)
            .populate({
                path: 'lots',
                populate: { path: 'rancher', select: 'name cpfCnpj' }
            });

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reordenar lotes
// @route   POST /api/slaughter/schedules/:id/reorder
export const reorderLots = async (req, res, next) => {
    try {
        const { lotIds } = req.body; // Array de IDs na nova ordem

        if (!lotIds || !Array.isArray(lotIds)) {
            return res.status(400).json({
                success: false,
                message: 'lotIds é obrigatório e deve ser um array'
            });
        }

        // Atualizar ordens
        const promises = lotIds.map((id, index) => {
            return SlaughterLot.findByIdAndUpdate(id, { order: index + 1 });
        });

        await Promise.all(promises);

        // Recalcular horários baseados na nova ordem
        await recalculateAllLots(req.params.id);

        const schedule = await SlaughterSchedule.findById(req.params.id)
            .populate({
                path: 'lots',
                populate: { path: 'rancher', select: 'name cpfCnpj' }
            });

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Fechar escala
// @route   POST /api/slaughter/schedules/:id/close
export const closeSchedule = async (req, res, next) => {
    try {
        const schedule = await SlaughterSchedule.findById(req.params.id)
            .populate({
                path: 'lots',
                populate: { path: 'rancher', select: 'name cpfCnpj' }
            });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Escala não encontrada'
            });
        }

        /*
        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Escala já está fechada'
            });
        }
        */

        if (!schedule.lots || schedule.lots.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Escala vazia não pode ser fechada'
            });
        }

        // Validar todos os lotes
        const invalidLot = schedule.lots.find(lot => lot.total === 0);
        if (invalidLot) {
            return res.status(400).json({
                success: false,
                message: `Lote ${invalidLot.lotNumber} tem total = 0`
            });
        }

        // Recalcular para garantir
        await recalculateAllLots(schedule._id);

        // Gerar PDF
        const pdfUrl = await generateSlaughterPDF(schedule);

        // Atualizar status
        schedule.status = 'CLOSED';
        schedule.closedBy = req.user.id;
        schedule.closedAt = new Date();
        schedule.pdfUrl = pdfUrl;
        await schedule.save();

        res.json({
            success: true,
            data: {
                ...schedule.toObject(),
                pdfUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reabrir escala (apenas admin)
// @route   POST /api/slaughter/schedules/:id/reopen
export const reopenSchedule = async (req, res, next) => {
    try {
        const schedule = await SlaughterSchedule.findByIdAndUpdate(
            req.params.id,
            {
                status: 'DRAFT',
                closedBy: null,
                closedAt: null,
                pdfUrl: null
            },
            { new: true }
        );

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Escala não encontrada'
            });
        }

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

// Funções auxiliares
async function recalculateAllLots(scheduleId) {
    console.log('Recalculating all lots for schedule:', scheduleId);
    try {
        const schedule = await SlaughterSchedule.findById(scheduleId);
        if (!schedule) throw new Error('Schedule not found');

        const lots = await SlaughterLot.find({ schedule: scheduleId }).sort('order');
        console.log('Found', lots.length, 'lots to recalculate');

        let previousEndTime = schedule.startTime;

        // Primeiro passo: remover números de lote para evitar colisões de índice único
        const step1Ops = lots.map((lot, i) => ({
            updateOne: {
                filter: { _id: lot._id },
                update: { $set: { lotNumber: -(i + 5000) } }
            }
        }));
        if (step1Ops.length > 0) await SlaughterLot.bulkWrite(step1Ops);

        // Segundo passo: atribuir números reais e calcular horários
        const step2Ops = [];
        for (let i = 0; i < lots.length; i++) {
            const lot = lots[i];
            const timing = calculateLotTiming(lot, previousEndTime, schedule);

            step2Ops.push({
                updateOne: {
                    filter: { _id: lot._id },
                    update: {
                        $set: {
                            lotNumber: i + 1,
                            order: i + 1,
                            startTime: timing.startTime,
                            durationMinutes: timing.durationMinutes,
                            endTime: timing.endTime,
                            total: timing.total
                        }
                    }
                }
            });

            previousEndTime = timing.endTime;
        }
        if (step2Ops.length > 0) await SlaughterLot.bulkWrite(step2Ops);

        await updateScheduleTotals(scheduleId);
        console.log('Recalculation complete for schedule:', scheduleId);
    } catch (error) {


        console.error('Error in recalculateAllLots:', error);
        throw error;
    }
}

async function updateScheduleTotals(scheduleId) {
    const lots = await SlaughterLot.find({ schedule: scheduleId });

    const totals = lots.reduce((acc, lot) => ({
        boi: acc.boi + (lot.boi || 0),
        vaca: acc.vaca + (lot.vaca || 0),
        novilha: acc.novilha + (lot.novilha || 0),
        bubalino: acc.bubalino + (lot.bubalino || 0),
        touro: acc.touro + (lot.touro || 0),
        total: acc.total + (lot.total || 0)
    }), { boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0, total: 0 });

    await SlaughterSchedule.findByIdAndUpdate(scheduleId, {
        totalBoi: totals.boi,
        totalVaca: totals.vaca,
        totalNovilha: totals.novilha,
        totalBubalino: totals.bubalino,
        totalTouro: totals.touro,
        totalCattle: totals.total
    });

    // Sincronizar com fechamento SIF se houver
    await syncClosureWithSchedule(scheduleId);
}

