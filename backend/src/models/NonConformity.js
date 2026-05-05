import mongoose from 'mongoose';

const historicoNcSchema = new mongoose.Schema({
    status_anterior: String,
    status_novo: String,
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data_hora: {
        type: Date,
        default: Date.now
    },
    comentario: String
});

const nonConformitySchema = new mongoose.Schema({
    codigo_nc: {
        type: String,
        required: true,
        unique: true
    },
    origem_execucao: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChecklistExecution',
        required: true
    },
    origem_item: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    descricao: {
        type: String,
        required: true
    },
    criticidade: {
        type: String,
        required: true,
        enum: ['Crítico', 'Maior', 'Menor']
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionArea',
        required: true
    },
    programa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PacProgram',
        required: true
    },
    responsavel_acao: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prazo: {
        type: Date,
        required: true
    },
    causa_raiz: String,
    acao_imediata: String,
    acao_corretiva: String,
    evidencia_eficacia: String, // Caminho do arquivo
    status: {
        type: String,
        required: true,
        enum: ['Aberta', 'Em andamento', 'Aguardando verificação', 'Fechada', 'Vencida'],
        default: 'Aberta'
    },
    data_abertura: {
        type: Date,
        default: Date.now
    },
    data_fechamento: Date,
    verificado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reincidente: {
        type: Boolean,
        default: false
    },
    historico_status: [historicoNcSchema]
}, {
    timestamps: true
});

const NonConformity = mongoose.model('NonConformity', nonConformitySchema);

export default NonConformity;
