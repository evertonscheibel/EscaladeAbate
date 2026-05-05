import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    type: {
        type: String,
        enum: ['equipamentos_industriais', 'licenca_software', 'dominio', 'contrato', 'garantia', 'boleto', 'outro', 'validacao_hardware'],
        required: true
    },
    documentNumber: {
        type: String,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    issueDate: {
        type: Date,
        required: true
    },
    expirationDate: {
        type: Date,
        required: true
    },
    deliverByDate: {
        type: Date
    },
    provider: {
        type: String,
        trim: true
    },
    value: {
        type: Number,
        default: 0
    },
    billingCycle: {
        type: String,
        enum: ['mensal', 'trimestral', 'semestral', 'anual', 'unico'],
        default: 'anual'
    },
    linkedAsset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    },
    filePath: String,
    status: {
        type: String,
        enum: ['ativo', 'expirado', 'renovado', 'revogados', 'cancelado', 'pendente', 'entregue', 'pago', 'atrasado'],
        default: 'ativo'
    },
    notifyBeforeDays: {
        type: Number,
        default: 30
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    notes: String,
    serialNumber: String,
    brand: String,
    model: String,
    imageUrl: String,
    notificationsSent: {
        days30: { type: Boolean, default: false },
        days15: { type: Boolean, default: false },
        days7: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Índice para buscar certificados próximos do vencimento
certificateSchema.index({ expirationDate: 1 });

// Virtual para dias até expiração
certificateSchema.virtual('daysUntilExpiration').get(function () {
    const diff = this.expirationDate - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
