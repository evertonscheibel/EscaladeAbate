import mongoose from 'mongoose';

const quoteItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true
    },
    deliveryTime: {
        type: Number, // em dias
        required: true
    },
    warranty: {
        type: Number, // em meses
        default: 0
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

const quoteSchema = new mongoose.Schema({
    quoteNumber: {
        type: String,
        unique: true,
        required: true
    },
    purchaseRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseRequest',
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    items: [quoteItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shipping: {
        type: Number,
        default: 0,
        min: 0
    },
    taxes: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalValue: {
        type: Number,
        required: true
    },
    paymentTerms: {
        type: String,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pendente', 'enviada', 'aceita', 'rejeitada', 'expirada'],
        default: 'pendente'
    },
    notes: String,
    attachments: [attachmentSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Middleware para gerar número da cotação
quoteSchema.pre('save', async function (next) {
    if (this.isNew && !this.quoteNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Quote').countDocuments();
        this.quoteNumber = `QT-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    // Calcular subtotal
    if (this.items && this.items.length > 0) {
        this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    // Calcular valor total
    this.totalValue = this.subtotal + this.shipping + this.taxes - this.discount;

    next();
});

// Middleware para calcular total de cada item
quoteItemSchema.pre('save', function (next) {
    this.totalPrice = this.quantity * this.unitPrice;
    next();
});

// Índices para performance
quoteSchema.index({ purchaseRequest: 1 });
quoteSchema.index({ supplier: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });


const Quote = mongoose.model('Quote', quoteSchema);

export default Quote;
