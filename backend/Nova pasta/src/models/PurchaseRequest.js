import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
    approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    level: {
        type: String,
        enum: ['gestor', 'diretor'],
        required: true
    },
    status: {
        type: String,
        enum: ['pendente', 'aprovado', 'rejeitado'],
        default: 'pendente'
    },
    comments: String,
    date: Date
});

const attachmentSchema = new mongoose.Schema({
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const purchaseRequestSchema = new mongoose.Schema({
    requestNumber: {
        type: String,
        unique: true
    },
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Descrição é obrigatória']
    },
    category: {
        type: String,
        enum: ['hardware', 'software', 'servico', 'consumivel', 'outro'],
        default: 'outro'
    },
    quantity: {
        type: Number,
        required: [true, 'Quantidade é obrigatória'],
        min: 1
    },
    estimatedValue: {
        type: Number,
        required: [true, 'Valor estimado é obrigatório'],
        min: 0
    },
    totalValue: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: [true, 'Departamento é obrigatório'],
        trim: true
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    urgency: {
        type: String,
        enum: ['baixa', 'media', 'alta', 'critica'],
        default: 'media'
    },
    justification: {
        type: String,
        required: [true, 'Justificativa é obrigatória']
    },
    status: {
        type: String,
        enum: [
            'rascunho',
            'aguardando_cotacao',
            'em_cotacao',
            'aguardando_aprovacao',
            'aprovado',
            'rejeitado',
            'cancelado',
            'concluido'
        ],
        default: 'rascunho'
    },
    approvalWorkflow: [approvalSchema],
    quotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote'
    }],
    selectedQuote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote'
    },
    purchaseOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder'
    },
    budgetImpact: {
        allocated: {
            type: Number,
            default: 0
        },
        spent: {
            type: Number,
            default: 0
        }
    },
    attachments: [attachmentSchema],
    rejectionReason: String,
    cancelReason: String
}, {
    timestamps: true
});

// Middleware para gerar número da solicitação
purchaseRequestSchema.pre('save', async function (next) {
    if (this.isNew && !this.requestNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('PurchaseRequest').countDocuments();
        this.requestNumber = `SR-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    // Calcular valor total
    this.totalValue = this.quantity * this.estimatedValue;

    next();
});

// Índices para performance
purchaseRequestSchema.index({ status: 1 });
purchaseRequestSchema.index({ department: 1 });
purchaseRequestSchema.index({ requester: 1 });
purchaseRequestSchema.index({ createdAt: -1 });
purchaseRequestSchema.index({ requestNumber: 1 });

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);

export default PurchaseRequest;
