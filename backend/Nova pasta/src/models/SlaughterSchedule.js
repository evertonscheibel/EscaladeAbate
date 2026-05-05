import mongoose from 'mongoose';

const slaughterScheduleSchema = new mongoose.Schema({
    slaughterDate: {
        type: Date,
        required: [true, 'Data do abate é obrigatória'],
        unique: true,
        index: true
    },
    startTime: {
        type: String, // "HH:mm" ex: "07:00"
        required: [true, 'Hora de início é obrigatória'],
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    },
    rateHeadsPerHour: {
        type: Number,
        default: 100,
        min: 1
    },
    status: {
        type: String,
        enum: ['DRAFT', 'CLOSED'],
        default: 'DRAFT',
        index: true
    },
    // Totais (desnormalizados para performance)
    totalBoi: { type: Number, default: 0 },
    totalVaca: { type: Number, default: 0 },
    totalNovilha: { type: Number, default: 0 },
    totalBubalino: { type: Number, default: 0 },
    totalCattle: { type: Number, default: 0 },

    pdfUrl: {
        type: String,
        trim: true
    },
    notes: String,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    closedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para lotes
slaughterScheduleSchema.virtual('lots', {
    ref: 'SlaughterLot',
    localField: '_id',
    foreignField: 'schedule',
    options: { sort: { lotNumber: 1 } }
});

const SlaughterSchedule = mongoose.model('SlaughterSchedule', slaughterScheduleSchema);

export default SlaughterSchedule;
