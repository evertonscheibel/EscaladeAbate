import mongoose from 'mongoose';

const jobPositionSchema = new mongoose.Schema({
    id_externo: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    titulo_vaga: {
        type: String,
        required: true,
        trim: true
    },
    setor: {
        type: String,
        required: true,
        trim: true
    },
    gestor: {
        type: String,
        trim: true
    },
    empresa: {
        type: String,
        trim: true
    },
    regiao: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['EM_ABERTO', 'FECHADA', 'CANCELADA'],
        default: 'EM_ABERTO'
    },
    qtd_vagas: {
        type: Number,
        default: 1
    },
    observacao: {
        type: String,
        trim: true
    },
    salario: {
        salario_base: Number,
        faixa_min: Number,
        faixa_max: Number,
        niveis: {
            type: Map,
            of: Number
        },
        moeda: {
            type: String,
            default: 'BRL'
        },
        confianca: String,
        referencia_cargo: String,
        referencia_setor: String
    }
}, {
    timestamps: true
});

// Índices para busca
jobPositionSchema.index({ titulo_vaga: 'text', setor: 'text', id_externo: 1 });

const JobPosition = mongoose.model('JobPosition', jobPositionSchema);

export default JobPosition;
