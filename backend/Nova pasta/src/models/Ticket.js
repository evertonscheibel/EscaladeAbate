import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
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

const ticketSchema = new mongoose.Schema({
    ticketNumber: {
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
        default: 'outros'
    },
    sector: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ['baixa', 'media', 'alta', 'critica'],
        default: 'media'
    },
    status: {
        type: String,
        enum: ['aberto', 'em_andamento', 'pendente_cliente', 'pendente_interno', 'resolvido', 'fechado'],
        default: 'aberto'
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Campos para tickets públicos (sem autenticação)
    contactName: {
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    contactPhone: {
        type: String,
        trim: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: Date,
    acceptedAt: Date,
    supportLevel: {
        type: String,
        enum: ['N1', 'N2', 'N3'],
        description: 'Nível de suporte necessário/atual'
    },
    firstResponseAt: Date,
    closedAt: Date,
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    },
    purchaseRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseRequest'
    },
    comments: [commentSchema],
    attachments: [attachmentSchema],
    resolvedAt: Date
}, {
    timestamps: true
});

// Gerar número do ticket antes de salvar
ticketSchema.pre('save', async function (next) {
    if (!this.ticketNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        this.ticketNumber = `TK-${year}${month}-${random}`;
    }
    next();
});

// Índices para performance
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ requester: 1 });
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
