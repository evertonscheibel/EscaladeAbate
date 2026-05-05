import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['alocacao', 'liberacao', 'gasto'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        model: {
            type: String,
            enum: ['PurchaseRequest', 'PurchaseOrder']
        },
        id: mongoose.Schema.Types.ObjectId
    },
    description: String
});

const alertSchema = new mongoose.Schema({
    threshold: {
        type: Number, // percentual
        required: true,
        min: 0,
        max: 100
    },
    notified: {
        type: Boolean,
        default: false
    },
    notifiedAt: Date
});

const budgetSchema = new mongoose.Schema({
    department: {
        type: String,
        required: [true, 'Departamento é obrigatório'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Ano é obrigatório']
    },
    category: {
        type: String,
        enum: ['hardware', 'software', 'servico', 'consumivel', 'outro', 'geral'],
        default: 'geral'
    },
    totalBudget: {
        type: Number,
        required: [true, 'Orçamento total é obrigatório'],
        min: 0
    },
    allocated: {
        type: Number,
        default: 0,
        min: 0
    },
    spent: {
        type: Number,
        default: 0,
        min: 0
    },
    available: {
        type: Number,
        default: 0
    },
    history: [historySchema],
    alerts: [alertSchema]
}, {
    timestamps: true
});

// Middleware para calcular disponível
budgetSchema.pre('save', function (next) {
    this.available = this.totalBudget - this.allocated - this.spent;

    // Verificar alertas
    if (this.alerts && this.alerts.length > 0) {
        const usedPercentage = ((this.allocated + this.spent) / this.totalBudget) * 100;

        this.alerts.forEach(alert => {
            if (usedPercentage >= alert.threshold && !alert.notified) {
                alert.notified = true;
                alert.notifiedAt = new Date();
            }
        });
    }

    next();
});

// Método para alocar orçamento
budgetSchema.methods.allocate = function (amount, reference, description) {
    this.allocated += amount;
    this.history.push({
        type: 'alocacao',
        amount,
        reference,
        description
    });
    return this.save();
};

// Método para liberar orçamento
budgetSchema.methods.release = function (amount, reference, description) {
    this.allocated -= amount;
    this.history.push({
        type: 'liberacao',
        amount,
        reference,
        description
    });
    return this.save();
};

// Método para registrar gasto
budgetSchema.methods.spend = function (amount, reference, description) {
    this.allocated -= amount;
    this.spent += amount;
    this.history.push({
        type: 'gasto',
        amount,
        reference,
        description
    });
    return this.save();
};

// Índices para performance
budgetSchema.index({ department: 1, year: 1, category: 1 }, { unique: true });
budgetSchema.index({ year: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
