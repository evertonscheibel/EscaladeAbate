import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
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
    deliveryTime: Number,
    warranty: Number
});

const receivedItemSchema = new mongoose.Schema({
    itemIndex: {
        type: Number,
        required: true
    },
    description: String,
    quantityReceived: {
        type: Number,
        required: true,
        min: 0
    },
    receiveDate: {
        type: Date,
        default: Date.now
    },
    condition: {
        type: String,
        enum: ['conforme', 'danificado', 'incompleto'],
        default: 'conforme'
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: String,
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
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

const purchaseOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    purchaseRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseRequest',
        required: true
    },
    quote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    items: [orderItemSchema],
    totalValue: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            'emitido',
            'confirmado',
            'em_transito',
            'recebido_parcial',
            'recebido_total',
            'cancelado'
        ],
        default: 'emitido'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    deliveryAddress: {
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
        zipCode: String
    },
    paymentStatus: {
        type: String,
        enum: ['pendente', 'parcial', 'pago'],
        default: 'pendente'
    },
    receivedItems: [receivedItemSchema],
    notes: String,
    attachments: [attachmentSchema]
}, {
    timestamps: true
});

// Middleware para gerar número do pedido
purchaseOrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('PurchaseOrder').countDocuments();
        this.orderNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    // Atualizar status baseado em recebimentos
    if (this.receivedItems && this.receivedItems.length > 0) {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReceived = this.receivedItems.reduce((sum, item) => sum + item.quantityReceived, 0);

        if (totalReceived >= totalItems) {
            this.status = 'recebido_total';
            if (!this.actualDeliveryDate) {
                this.actualDeliveryDate = new Date();
            }
        } else if (totalReceived > 0) {
            this.status = 'recebido_parcial';
        }
    }

    next();
});

// Índices para performance
purchaseOrderSchema.index({ purchaseRequest: 1 });
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ createdAt: -1 });


const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
