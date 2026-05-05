import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const pacProgramSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'Código do programa é obrigatório'],
        unique: true,
        trim: true,
        uppercase: true
    },
    nome: {
        type: String,
        required: [true, 'Nome do programa é obrigatório'],
        trim: true
    },
    descricao: {
        type: String,
        trim: true
    },
    responsavel_tecnico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Responsável técnico é obrigatório']
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

pacProgramSchema.plugin(softDeletePlugin);

const PacProgram = mongoose.model('PacProgram', pacProgramSchema);

export default PacProgram;
