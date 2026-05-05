import SlaughterSchedule from '../models/SlaughterSchedule.js';
import SlaughterLot from '../models/SlaughterLot.js';
import { generateSlaughterPDF } from '../utils/pdfGenerator.js';

// Função auxiliar: calcular horários
function calculateLotTiming(lot, previousEndTime, ratePerHour = 100) {
    const total = (lot.boi || 0) + (lot.vaca || 0) + (lot.novilha || 0) + (lot.bubalino || 0);
    const durationMinutes = Math.ceil((total / ratePerHour) * 60);

    // Converter HH:mm para minutos
    const [prevHours, prevMinutes] = previousEndTime.split(':').map(Number);
    const totalMinutes = prevHours * 60 + prevMinutes + durationMinutes;

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    return {
        total,
        startTime: previousEndTime,
        durationMinutes,
        endTime
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
        }).select('slaughterDate status totalCattle');

        const calendar = schedules.map(s => ({
            date: s.slaughterDate.toISOString().split('T')[0],
            status: s.status,
            totalCattle: s.totalCattle
        }));

        res.json({
            success: true,
            data: calendar
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

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Escala fechada não pode ser editada'
            });
        }

        const updated = await SlaughterSchedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

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

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível adicionar lotes em escala fechada'
            });
        }

        // Calcular ordem
        const existingLots = await SlaughterLot.find({ schedule: schedule._id }).sort('lotNumber');
        const order = existingLots.length + 1;

        // Calcular horários
        const previousEndTime = existingLots.length > 0
            ? existingLots[existingLots.length - 1].endTime
            : schedule.startTime;

        const timing = calculateLotTiming(req.body, previousEndTime, schedule.rateHeadsPerHour);

        const lot = await SlaughterLot.create({
            ...req.body,
            schedule: schedule._id,
            order,
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

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível editar lote de escala fechada'
            });
        }

        // Atualizar lote
        const updated = await SlaughterLot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('rancher', 'name cpfCnpj');

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

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir lote de escala fechada'
            });
        }

        await SlaughterLot.findByIdAndDelete(req.params.id);

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

        if (schedule.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Escala já está fechada'
            });
        }

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
    const schedule = await SlaughterSchedule.findById(scheduleId);
    const lots = await SlaughterLot.find({ schedule: scheduleId }).sort('lotNumber');

    let previousEndTime = schedule.startTime;

    for (const lot of lots) {
        const timing = calculateLotTiming(lot, previousEndTime, schedule.rateHeadsPerHour);

        lot.startTime = timing.startTime;
        lot.durationMinutes = timing.durationMinutes;
        lot.endTime = timing.endTime;
        lot.total = timing.total;

        await lot.save();
        previousEndTime = timing.endTime;
    }

    await updateScheduleTotals(scheduleId);
}

async function updateScheduleTotals(scheduleId) {
    const lots = await SlaughterLot.find({ schedule: scheduleId });

    const totals = lots.reduce((acc, lot) => ({
        boi: acc.boi + (lot.boi || 0),
        vaca: acc.vaca + (lot.vaca || 0),
        novilha: acc.novilha + (lot.novilha || 0),
        bubalino: acc.bubalino + (lot.bubalino || 0),
        total: acc.total + (lot.total || 0)
    }), { boi: 0, vaca: 0, novilha: 0, bubalino: 0, total: 0 });

    await SlaughterSchedule.findByIdAndUpdate(scheduleId, {
        totalBoi: totals.boi,
        totalVaca: totals.vaca,
        totalNovilha: totals.novilha,
        totalBubalino: totals.bubalino,
        totalCattle: totals.total
    });
}
