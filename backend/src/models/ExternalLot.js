import mongoose from 'mongoose';

const externalLotSchema = new mongoose.Schema({
    externalLotCode: { type: String, required: true, trim: true },
    arrivalDate: { type: Date, required: true },
    slaughterDate: Date,
    supplierName: { type: String, required: true, trim: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // se existir model Supplier
    brokerName: String,
    documents: {
        nf: String,
        gta: String,
        other: String
    },
    defaultMarket: { type: String, enum: ['MI', 'EXP', 'IND', 'MI_EXP'], default: 'MI' },
    weightInKg: { type: Number, min: 0 },
    carcasses: { type: Number, default: 0, min: 0 },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

externalLotSchema.index({ arrivalDate: 1 });
externalLotSchema.index({ externalLotCode: 1 });

const ExternalLot = mongoose.model('ExternalLot', externalLotSchema);
export default ExternalLot;
