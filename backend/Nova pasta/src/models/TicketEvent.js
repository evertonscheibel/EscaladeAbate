import mongoose from 'mongoose';

const ticketEventSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'CREATED',
            'ASSIGNED',
            'ACCEPTED',
            'WORK_STARTED',
            'PENDING_CUSTOMER',
            'PENDING_INTERNAL',
            'TRANSFERRED',
            'RESOLVED',
            'CLOSED',
            'REOPENED',
            'COMMENT_ADDED',
            'PRIORITY_CHANGED',
            'CATEGORY_CHANGED'
        ],
        required: true
    },
    at: {
        type: Date,
        default: Date.now,
        required: true
    },
    byUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Flexível para guardar { from: 'A', to: 'B', reason: '...' }
    visibility: {
        type: String,
        enum: ['INTERNAL', 'PUBLIC'],
        default: 'INTERNAL'
    }
}, {
    timestamps: true
});

const TicketEvent = mongoose.model('TicketEvent', ticketEventSchema);

export default TicketEvent;
