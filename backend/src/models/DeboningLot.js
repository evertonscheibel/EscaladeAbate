import mongoose from 'mongoose';

const deboningLotSchema = new mongoose.Schema({
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeboningSchedule',
        required: true,
        index: true
    },
    lotNumber: {
        type: Number,
        required: [true, 'Número do lote é obrigatório']
    },
    // Referência ao lote de abate original (rastreabilidade)
    slaughterLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SlaughterLot'
    },
    // Identificação do lote
    broker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeboningBroker'
    },
    origin: {
        type: String,
        required: [true, 'Origem/produtor é obrigatória'],
        trim: true
    },
    sifNumber: {
        type: String,
        trim: true
    },

    // Quantidades de carcaças por tipo
    boi: { type: Number, default: 0, min: 0 },
    vaca: { type: Number, default: 0, min: 0 },
    novilha: { type: Number, default: 0, min: 0 },
    bubalino: { type: Number, default: 0, min: 0 },
    touro: { type: Number, default: 0, min: 0 },

    // Detalhado por animal
    breakdown: {
        boi: { traseiro: { type: Number, default: 0 }, dianteiro: { type: Number, default: 0 }, ponta: { type: Number, default: 0 }, cupim: { type: Number, default: 0 } },
        vaca: { traseiro: { type: Number, default: 0 }, dianteiro: { type: Number, default: 0 }, ponta: { type: Number, default: 0 }, cupim: { type: Number, default: 0 } },
        novilha: { traseiro: { type: Number, default: 0 }, dianteiro: { type: Number, default: 0 }, ponta: { type: Number, default: 0 }, cupim: { type: Number, default: 0 } },
        bubalino: { traseiro: { type: Number, default: 0 }, dianteiro: { type: Number, default: 0 }, ponta: { type: Number, default: 0 }, cupim: { type: Number, default: 0 } },
        touro: { traseiro: { type: Number, default: 0 }, dianteiro: { type: Number, default: 0 }, ponta: { type: Number, default: 0 }, cupim: { type: Number, default: 0 } },
    },

    totalCarcassas: { type: Number, required: true, min: 1 },


    // Peso médio estimado por carcaça (kg)
    pesoMedioCarcassa: {
        type: Number,
        default: 250,
        min: 50
    },

    // Produção por corte (kg) - preenchido durante/após processamento
    production: {
        traseiro: { type: Number, default: 0, min: 0 },
        dianteiro: { type: Number, default: 0, min: 0 },
        pontaAgulha: { type: Number, default: 0, min: 0 },
        cupim: { type: Number, default: 0, min: 0 },
        recortes: { type: Number, default: 0, min: 0 },
        osso: { type: Number, default: 0, min: 0 },
        sebo: { type: Number, default: 0, min: 0 },
        miudos: { type: Number, default: 0, min: 0 },
        outros: { type: Number, default: 0, min: 0 }
    },

    totalProduzidoKg: { type: Number, default: 0, min: 0 },

    // Destino do lote
    destino: {
        type: String,
        enum: ['MERCADO_INTERNO', 'EXPORTACAO', 'MERCADO_INTERNO_EXPORTACAO', 'INDUSTRIALIZACAO'],
        default: 'MERCADO_INTERNO'
    },
    destinoDetalhe: {
        type: String,
        trim: true
    },

    // Status do lote
    lotStatus: {
        type: String,
        enum: ['PENDENTE', 'EM_PROCESSO', 'CONCLUIDO'],
        default: 'PENDENTE'
    },

    // Horários calculados ou manuais
    startTime: {
        type: String, // "HH:mm"
    },
    durationMinutes: {
        type: Number,
        min: 0
    },
    endTime: {
        type: String, // "HH:mm"
    },
    manualTimes: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: true
    },

    // --- PCP Updates ---
    sourceType: {
        type: String,
        enum: ['INTERNAL', 'EXTERNAL'],
        default: 'INTERNAL'
    },
    plannedMarket: {
        type: String,
        enum: ['MI', 'EXP', 'MI_EXP', 'IND'],
        default: 'MI'
    },
    externalLotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExternalLot'
    },

    // Observações
    qualityNotes: String,
    notes: String
}, {
    timestamps: true
});

// Index composto para garantir lotNumber único por schedule
deboningLotSchema.index({ schedule: 1, lotNumber: 1 }, { unique: true });

// Middleware para calcular totais antes de salvar
deboningLotSchema.pre('save', function (next) {
    const calculatedTotal = (this.boi || 0) + (this.vaca || 0) + (this.novilha || 0) + (this.bubalino || 0) + (this.touro || 0);
    if (calculatedTotal > 0) {
        this.totalCarcassas = calculatedTotal;
    }

    if (this.production) {
        this.totalProduzidoKg = (this.production.traseiro || 0) +
            (this.production.dianteiro || 0) +
            (this.production.pontaAgulha || 0) +
            (this.production.cupim || 0) +
            (this.production.recortes || 0) +
            (this.production.osso || 0) +
            (this.production.sebo || 0) +
            (this.production.miudos || 0) +
            (this.production.outros || 0);
    }

    next();
});

const DeboningLot = mongoose.model('DeboningLot', deboningLotSchema);

export default DeboningLot;
