import mongoose from 'mongoose';

const partSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome da peça é obrigatório'],
        trim: true
    },
    partNumber: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantidade é obrigatória'],
        min: [1, 'Quantidade deve ser maior que zero']
    },
    unitCost: {
        type: Number,
        required: [true, 'Custo unitário é obrigatório'],
        min: [0, 'Custo não pode ser negativo']
    },
    supplier: {
        type: String,
        trim: true
    }
});

const maintenanceSchema = new mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: [true, 'Ativo é obrigatório']
    },
    type: {
        type: String,
        enum: ['preventiva', 'corretiva', 'preditiva', 'emergencial'],
        required: [true, 'Tipo de manutenção é obrigatório']
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
    startDate: {
        type: Date,
        required: [true, 'Data de início é obrigatória']
    },
    endDate: {
        type: Date
    },
    scheduledDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['agendada', 'em_andamento', 'concluida', 'cancelada'],
        default: 'agendada'
    },
    priority: {
        type: String,
        enum: ['baixa', 'media', 'alta', 'critica'],
        default: 'media'
    },
    responsible: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Responsável é obrigatório']
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    parts: [partSchema],
    laborCost: {
        type: Number,
        default: 0,
        min: [0, 'Custo de mão de obra não pode ser negativo']
    },
    totalCost: {
        type: Number,
        default: 0,
        min: [0, 'Custo total não pode ser negativo']
    },
    downtime: {
        type: Number, // em horas
        default: 0
    },
    notes: {
        type: String
    },
    attachments: [{
        fileName: String,
        filePath: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    relatedTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }
}, {
    timestamps: true
});

// Calcular custo total automaticamente
maintenanceSchema.pre('save', function (next) {
    const partsCost = this.parts.reduce((total, part) => {
        return total + (part.quantity * part.unitCost);
    }, 0);

    this.totalCost = partsCost + (this.laborCost || 0);
    next();
});

// Índices para performance
maintenanceSchema.index({ asset: 1, createdAt: -1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ type: 1 });
maintenanceSchema.index({ startDate: 1 });
maintenanceSchema.index({ responsible: 1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
