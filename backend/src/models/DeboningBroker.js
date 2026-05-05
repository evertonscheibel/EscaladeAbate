import mongoose from 'mongoose';

const deboningBrokerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do corretor é obrigatório'],
        trim: true,
        index: true
    },
    cpfCnpj: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    },
    razaoSocial: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

deboningBrokerSchema.index({ name: 'text', cpfCnpj: 'text' });

const DeboningBroker = mongoose.model('DeboningBroker', deboningBrokerSchema);

export default DeboningBroker;
