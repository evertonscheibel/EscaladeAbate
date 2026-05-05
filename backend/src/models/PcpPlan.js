import mongoose from 'mongoose';

const pcpPlanSchema = new mongoose.Schema({
    periodType: { type: String, enum: ['MONTH', 'WEEK'], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: ['DRAFT', 'LOCKED'], default: 'DRAFT' },
    targetsByMarket: {
        MI: { type: Number, default: 0 },   // kg ou cabeças
        EXP: { type: Number, default: 0 },
        IND: { type: Number, default: 0 }
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

pcpPlanSchema.index({ periodType: 1, periodStart: 1 });

const PcpPlan = mongoose.model('PcpPlan', pcpPlanSchema);
export default PcpPlan;
