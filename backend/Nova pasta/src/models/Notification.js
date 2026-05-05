import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['certificado', 'boleto', 'ticket', 'sistema'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    referenceId: mongoose.Schema.Types.ObjectId,
    referenceModel: {
        type: String,
        enum: ['Ticket', 'Certificate', 'Boleto']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['baixa', 'media', 'alta'],
        default: 'media'
    }
}, {
    timestamps: true
});

// Índices
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
