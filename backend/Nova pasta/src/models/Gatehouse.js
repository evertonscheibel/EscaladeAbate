import mongoose from 'mongoose';

const gatehouseSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome da guarita é obrigatório'],
        unique: true,
        trim: true
    },
    localizacao: {
        type: String,
        trim: true
    },
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
gatehouseSchema.index({ ativo: 1 });

const Gatehouse = mongoose.model('Gatehouse', gatehouseSchema);

export default Gatehouse;
