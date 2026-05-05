import mongoose from 'mongoose';

const accessTypeSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome do tipo de acesso é obrigatório'],
        unique: true,
        trim: true
    },
    descricao: String,
    cor: {
        type: String,
        default: '#3B82F6'
    },
    icone: {
        type: String,
        default: 'Truck'
    },
    ordem: {
        type: Number,
        default: 0
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const AccessType = mongoose.model('AccessType', accessTypeSchema);

export default AccessType;
