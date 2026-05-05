import mongoose from 'mongoose';

const importJobSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['PRE_SCHEDULE_IMPORT', 'CLOSURE_IMPORT', 'EXTERNAL_LOT_IMPORT'],
        required: true
    },
    status: {
        type: String,
        enum: ['UPLOADED', 'PARSING', 'VALIDATED', 'COMMITTED', 'FAILED'],
        default: 'UPLOADED'
    },
    fileName: { type: String, required: true },
    filePath: String,
    targetDate: Date,                          // para imports de abate: data da escala
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    errorRows: { type: Number, default: 0 },
    errors: [{
        row: Number,
        field: String,
        message: String
    }],
    committedAt: Date,
    committedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

importJobSchema.index({ type: 1, status: 1 });
importJobSchema.index({ createdAt: -1 });

const ImportJob = mongoose.model('ImportJob', importJobSchema);
export default ImportJob;
