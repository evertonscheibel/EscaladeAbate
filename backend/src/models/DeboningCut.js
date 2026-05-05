import mongoose from 'mongoose';

const deboningCutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do corte é obrigatório'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    },
    broker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeboningBroker',
        index: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const DeboningCut = mongoose.model('DeboningCut', deboningCutSchema);

export default DeboningCut;
