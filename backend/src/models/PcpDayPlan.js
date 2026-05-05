import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    start: { type: String, required: true },  // HH:mm
    end: { type: String, required: true },
    teamName: String
});

const breakSchema = new mongoose.Schema({
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String, default: 'Intervalo' }
});

const pcpDayPlanSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    status: { type: String, enum: ['DRAFT', 'IN_PROGRESS', 'CLOSED'], default: 'DRAFT' },

    // Links para módulos existentes
    links: {
        preScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlaughterPreSchedule' },
        closureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlaughterClosure' },
        deboningScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeboningSchedule' }
    },

    // Capacidade e configuração do dia
    capacity: {
        targetCarcassesPerHour: { type: Number, default: 100 },
        shifts: [shiftSchema],
        breaks: [breakSchema],
        coldRoomCapacity: Number
    },

    // Metas por mercado
    plannedByMarket: {
        MI: { type: Number, default: 0 },
        EXP: { type: Number, default: 0 },
        IND: { type: Number, default: 0 }
    },

    // Realizado (atualizado ao fechar desossa/abate)
    realizedByMarket: {
        MI: { type: Number, default: 0 },
        EXP: { type: Number, default: 0 },
        IND: { type: Number, default: 0 }
    },

    // Totais
    totalSlaughterCattle: { type: Number, default: 0 },
    totalDeboningCarcasses: { type: Number, default: 0 },
    totalExternalLots: { type: Number, default: 0 },

    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: Date
}, { timestamps: true });

pcpDayPlanSchema.index({ date: 1 }, { unique: true });
pcpDayPlanSchema.index({ status: 1 });

const PcpDayPlan = mongoose.model('PcpDayPlan', pcpDayPlanSchema);
export default PcpDayPlan;
