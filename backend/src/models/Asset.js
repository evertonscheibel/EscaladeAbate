import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const assetSchema = new mongoose.Schema({
    assetId: {
        type: String,
        required: [true, 'ID do ativo é obrigatório'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Descrição é obrigatória'],
        trim: true
    },
    type: {
        type: String,
        enum: ['notebook', 'desktop', 'monitor', 'impressora', 'servidor', 'rede', 'periferico', 'software', 'outro'],
        default: 'outro'
    },
    brand: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    serialNumber: {
        type: String,
        trim: true,
        sparse: true
    },
    location: {
        type: String,
        trim: true
    },
    acquisitionDate: Date,
    purchaseDate: Date,
    purchaseValue: {
        type: Number,
        min: 0
    },
    warrantyExpiration: Date,
    status: {
        type: String,
        enum: ['ativo', 'em_manutencao', 'disponivel', 'descartado', 'perdido'],
        default: 'ativo'
    },
    responsible: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: String,
        trim: true
    },
    // Campos de Rede e Identificação
    ipAddress: { type: String, trim: true },
    macAddress: { type: String, trim: true },
    hostname: { type: String, trim: true },
    anydeskId: { type: String, trim: true },

    // Especificações de Hardware
    specs: {
        processor: { type: String, trim: true },
        ram: { type: String, trim: true }, // Ex: 8GB
        storage: { type: String, trim: true }, // Ex: SSD 240GB
        videoOutputPc: { type: String, trim: true }, // Ex: VGA, HDMI
        videoOutputMonitor: { type: String, trim: true },
        accessories: { type: String, trim: true } // Ex: Mouse, Teclado
    },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceInterval: {
        type: Number, // em dias
        default: 180
    },
    notes: String,
    customFields: {
        type: mongoose.Schema.Types.Mixed
    },
    // Rastreabilidade de compra
    purchaseOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder'
    },
    purchaseRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseRequest'
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    isNetworkDevice: {
        type: Boolean,
        default: false
    },
    linkedDocuments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para manutenções
assetSchema.virtual('maintenances', {
    ref: 'Maintenance',
    localField: '_id',
    foreignField: 'asset'
});

// Virtual para timeline
assetSchema.virtual('timeline', {
    ref: 'AssetTimeline',
    localField: '_id',
    foreignField: 'asset'
});

// Índices para performance
assetSchema.index({ assetId: 1 }, { unique: true });
assetSchema.index({ status: 1, type: 1 });
assetSchema.index({ location: 1 });

// Aplicar plugin de Soft Delete
assetSchema.plugin(softDeletePlugin);

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
