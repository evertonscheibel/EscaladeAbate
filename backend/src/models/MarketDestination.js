import mongoose from 'mongoose';

const marketDestinationSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    requiresExportDocs: { type: Boolean, default: false },
    notes: String
}, { timestamps: true });

const MarketDestination = mongoose.model('MarketDestination', marketDestinationSchema);
export default MarketDestination;
