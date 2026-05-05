import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const slaughterLotSchema = new mongoose.Schema({
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SlaughterSchedule',
        required: true,
        index: true
    },
    lotNumber: {
        type: Number,
        required: [true, 'Número do lote é obrigatório']
    },
    rancher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rancher'
    },
    rancherName: {
        type: String,
        required: [true, 'Nome do pecuarista é obrigatório'],
        trim: true
    },
    brokerNumber: {
        type: String,
        required: [true, 'Número do corretor é obrigatório'],
        trim: true
    },
    boi: {
        type: Number,
        default: 0,
        min: 0
    },
    vaca: {
        type: Number,
        default: 0,
        min: 0
    },
    novilha: {
        type: Number,
        default: 0,
        min: 0
    },
    bubalino: {
        type: Number,
        default: 0,
        min: 0
    },
    touro: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 1
    },
    // Horários calculados
    startTime: {
        type: String, // "HH:mm"
        required: true
    },
    durationMinutes: {
        type: Number,
        required: true,
        min: 0
    },
    endTime: {
        type: String, // "HH:mm"
        required: true
    },
    order: {
        type: Number, // ordem de processamento
        required: true
    }
}, {
    timestamps: true
});

// Index composto para garantir lotNumber único por schedule
slaughterLotSchema.index({ schedule: 1, lotNumber: 1 }, { unique: true });

// Middleware para calcular total antes de salvar
slaughterLotSchema.pre('save', function (next) {
    this.total = (this.boi || 0) + (this.vaca || 0) + (this.novilha || 0) + (this.bubalino || 0) + (this.touro || 0);
    next();
});

// Aplicar plugin de Soft Delete
slaughterLotSchema.plugin(softDeletePlugin);

const SlaughterLot = mongoose.model('SlaughterLot', slaughterLotSchema);

export default SlaughterLot;
