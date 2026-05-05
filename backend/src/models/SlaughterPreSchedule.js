import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const preScheduleLotSchema = new mongoose.Schema({
    preLotRefId: { type: String, required: true }, // UUID gerado no front ou ObjectId — chave de dedupe
    producerName: { type: String, required: true, trim: true },
    municipio: { type: String, trim: true },
    uf: { type: String, maxlength: 2, uppercase: true },
    brokerCode: { type: String, trim: true },
    brokerName: { type: String, trim: true },
    boi: { type: Number, default: 0, min: 0 },
    vaca: { type: Number, default: 0, min: 0 },
    novilha: { type: Number, default: 0, min: 0 },
    bubalino: { type: Number, default: 0, min: 0 },
    touro: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0 },
    notes: String
});

preScheduleLotSchema.pre('save', function () {
    this.total = (this.boi || 0) + (this.vaca || 0) + (this.novilha || 0) + (this.bubalino || 0) + (this.touro || 0);
});

const slaughterPreScheduleSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    startTime: { type: String, default: '07:00' },
    rateHeadsPerHour: { type: Number, default: 100 },
    status: {
        type: String,
        enum: ['DRAFT', 'ENVIADA', 'PUBLISHED', 'CANCELADA'],
        default: 'DRAFT',
        index: true
    },
    lots: [preScheduleLotSchema],
    totalCattle: { type: Number, default: 0 },
    // Intervalos
    breakfastTime: { type: String, default: '08:00' },
    breakfastDuration: { type: Number, default: 15 },
    lunchTime: { type: String, default: '11:00' },
    lunchDuration: { type: Number, default: 70 },
    notes: String,
    lastRequestId: { type: String }, // Para idempotência (UUID)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: Date,
    version: { type: Number, default: 1 },
    history: [{
        version: Number,
        updatedAt: Date,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        snapshot: mongoose.Schema.Types.Mixed,
        changeLog: String
    }]
}, { timestamps: true });

slaughterPreScheduleSchema.pre('save', function () {
    this.totalCattle = this.lots.reduce((sum, lot) => sum + (lot.total || 0), 0);
});

slaughterPreScheduleSchema.index({ date: 1 }, { unique: true });

// Aplicar plugin de Soft Delete
slaughterPreScheduleSchema.plugin(softDeletePlugin);

const SlaughterPreSchedule = mongoose.model('SlaughterPreSchedule', slaughterPreScheduleSchema);
export default SlaughterPreSchedule;
