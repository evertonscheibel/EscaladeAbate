import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const SlaughterVersionSchema = new mongoose.Schema({
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    resourceType: {
        type: String,
        enum: ['SlaughterSchedule', 'SlaughterLot'],
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    data: {
        type: Object,
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changeReason: String,
    metadata: {
        ip: String,
        userAgent: String
    }
}, {
    timestamps: true
});

SlaughterVersionSchema.index({ resourceId: 1, version: -1 });

const SlaughterVersion = mongoose.model('SlaughterVersion', SlaughterVersionSchema);
export default SlaughterVersion;
