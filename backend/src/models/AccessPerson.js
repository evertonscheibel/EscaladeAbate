import mongoose from 'mongoose';

const accessPersonSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    documento: {
        type: String,
        trim: true
    },
    telefone: {
        type: String,
        trim: true
    },
    empresa_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    recorrente: {
        type: Boolean,
        default: false
    },
    observacoes: String,
    ativo: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Índices
accessPersonSchema.index({ nome: 1 });
accessPersonSchema.index({ recorrente: 1, ativo: 1 });
accessPersonSchema.index({ empresa_id: 1 });

const AccessPerson = mongoose.model('AccessPerson', accessPersonSchema);

export default AccessPerson;
