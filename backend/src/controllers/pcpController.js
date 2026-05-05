import PcpDayPlan from '../models/PcpDayPlan.js';
import PcpPlan from '../models/PcpPlan.js';
import MarketDestination from '../models/MarketDestination.js';
import SlaughterPreSchedule from '../models/SlaughterPreSchedule.js';
import SlaughterClosure from '../models/SlaughterClosure.js';
import DeboningSchedule from '../models/DeboningSchedule.js';

// @desc    Obter calendário PCP
// @route   GET /api/pcp/calendar
export const getCalendar = async (req, res, next) => {
    try {
        const { month } = req.query; // YYYY-MM
        const start = new Date(month + '-01');
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const days = await PcpDayPlan.find({
            date: { $gte: start, $lt: end }
        }).populate('links.preScheduleId links.closureId links.deboningScheduleId');

        res.json({ success: true, data: days });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter ou criar plano diário
// @route   GET /api/pcp/day/:date
export const getDayPlan = async (req, res, next) => {
    try {
        const { date } = req.params;
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        let plan = await PcpDayPlan.findOne({ date: normalizedDate })
            .populate('links.preScheduleId')
            .populate('links.closureId')
            .populate('links.deboningScheduleId');

        if (!plan) {
            plan = await PcpDayPlan.create({
                date: normalizedDate,
                createdBy: req.user.id,
                capacity: {
                    targetCarcassesPerHour: 100,
                    shifts: [{ start: '07:00', end: '16:00', teamName: 'Equipe A' }],
                    breaks: [{ start: '09:00', end: '09:15', label: 'Café' }, { start: '12:00', end: '13:00', label: 'Almoço' }]
                }
            });
        }

        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar plano diário
// @route   PUT /api/pcp/day/:id
export const updateDayPlan = async (req, res, next) => {
    try {
        const allowedFields = ['notes', 'capacity', 'links', 'slaughterMetrics', 'deboningMetrics', 'qualityFlags'];
        const updateData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

        const plan = await PcpDayPlan.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

// @desc    Iniciar plano diário
// @route   POST /api/pcp/day/:id/start
export const startDayPlan = async (req, res, next) => {
    try {
        const plan = await PcpDayPlan.findByIdAndUpdate(req.params.id, { status: 'IN_PROGRESS' }, { new: true });
        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

// @desc    Fechar plano diário
// @route   POST /api/pcp/day/:id/close
export const closeDayPlan = async (req, res, next) => {
    try {
        const plan = await PcpDayPlan.findById(req.params.id).populate('links.closureId links.deboningScheduleId');

        if (!plan.links.closureId || plan.links.closureId.status !== 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Fechamento SIF deve estar concluído' });
        }

        if (!plan.links.deboningScheduleId || plan.links.deboningScheduleId.status !== 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Programação de Desossa deve estar concluída' });
        }

        plan.status = 'CLOSED';
        plan.closedBy = req.user.id;
        plan.closedAt = new Date();
        await plan.save();

        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter mercados
// @route   GET /api/pcp/markets
export const getMarkets = async (req, res, next) => {
    try {
        const markets = await MarketDestination.find({ active: true });
        res.json({ success: true, data: markets });
    } catch (error) {
        next(error);
    }
};

// ... outros métodos dos planos mensais e relatórios ...
