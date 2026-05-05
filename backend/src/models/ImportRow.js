import mongoose from 'mongoose';

const importRowSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportJob', required: true, index: true },
    rowNumber: { type: Number, required: true },
    status: { type: String, enum: ['VALID', 'ERROR', 'DUPLICATE', 'SKIPPED'], default: 'VALID' },
    rawData: mongoose.Schema.Types.Mixed,       // dados brutos da planilha
    parsedData: mongoose.Schema.Types.Mixed,     // dados normalizados
    errors: [{ field: String, message: String }],
    isDuplicate: { type: Boolean, default: false }
}, { timestamps: true });

importRowSchema.index({ jobId: 1, rowNumber: 1 });

const ImportRow = mongoose.model('ImportRow', importRowSchema);
export default ImportRow;
