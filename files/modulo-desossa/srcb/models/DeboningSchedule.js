import mongoose from 'mongoose';

const deboningScheduleSchema = new mongoose.Schema({
    scheduleDate: {
        type: Date,
        required: [true, 'Data da desossa é obrigatória'],
        unique: true,
        index: true
    },
    // Referência à escala de abate do dia (ou dia anterior)
    slaughterSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SlaughterSchedule'
    },
    startTime: {
        type: String, // "HH:mm"
        required: [true, 'Hora de início é obrigatória'],
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
        default: '06:00'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'IN_PROGRESS', 'CLOSED'],
        default: 'DRAFT',
        index: true
    },

    // Configurações de produção
    targetCarcassesPerHour: {
        type: Number,
        default: 50,
        min: 1
    },

    // Totais de carcaças programadas (desnormalizados)
    totalCarcassas: { type: Number, default: 0 },
    totalBoi: { type: Number, default: 0 },
    totalVaca: { type: Number, default: 0 },
    totalNovilha: { type: Number, default: 0 },
    totalBubalino: { type: Number, default: 0 },
    totalTouro: { type: Number, default: 0 },

    // Totais de produção (kg) - atualizados quando items são registrados
    totalTraseiro: { type: Number, default: 0 },
    totalDianteiro: { type: Number, default: 0 },
    totalPonta: { type: Number, default: 0 },
    totalRecortes: { type: Number, default: 0 },
    totalOsso: { type: Number, default: 0 },
    totalSebo: { type: Number, default: 0 },
    totalProduzidoKg: { type: Number, default: 0 },

    // Intervalos
    breakfastTime: { type: String, default: '08:00' },
    breakfastDuration: { type: Number, default: 15 },
    lunchTime: { type: String, default: '11:00' },
    lunchDuration: { type: Number, default: 60 },

    // Equipes programadas
    teams: [{
        teamName: {
            type: String,
            required: true,
            trim: true
        },
        leader: {
            type: String,
            trim: true
        },
        members: {
            type: Number,
            default: 0,
            min: 0
        },
        sector: {
            type: String,
            enum: ['TRASEIRO', 'DIANTEIRO', 'MIUDOS', 'EMBALAGEM', 'CARREGAMENTO', 'GERAL'],
            default: 'GERAL'
        }
    }],

    // Temperatura da câmara fria no início do dia
    chamberTemperature: {
        type: Number, // em °C
        min: -10,
        max: 15
    },

    pdfUrl: {
        type: String,
        trim: true
    },
    notes: String,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    closedAt: Date,
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    startedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para lotes de desossa
deboningScheduleSchema.virtual('lots', {
    ref: 'DeboningLot',
    localField: '_id',
    foreignField: 'schedule',
    options: { sort: { order: 1 } }
});

const DeboningSchedule = mongoose.model('DeboningSchedule', deboningScheduleSchema);

export default DeboningSchedule;
