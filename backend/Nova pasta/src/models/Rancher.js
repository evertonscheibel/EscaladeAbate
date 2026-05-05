import mongoose from 'mongoose';

const rancherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do pecuarista é obrigatório'],
        trim: true,
        index: true
    },
    cpfCnpj: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
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

// Index para busca rápida (autocomplete)
rancherSchema.index({ name: 'text', cpfCnpj: 'text' });

const Rancher = mongoose.model('Rancher', rancherSchema);

export default Rancher;
