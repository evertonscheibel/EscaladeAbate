import mongoose from 'mongoose';

const accessReasonSchema = new mongoose.Schema({
    tipo_acesso_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessType',
        required: [true, 'Tipo de acesso é obrigatório']
    },
    nome: {
        type: String,
        required: [true, 'Nome do motivo é obrigatório'],
        trim: true
    },
    descricao: String,
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

// Índices
accessReasonSchema.index({ tipo_acesso_id: 1, ativo: 1 });

const AccessReason = mongoose.model('AccessReason', accessReasonSchema);

export default AccessReason;
