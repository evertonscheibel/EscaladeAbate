import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const itemChecklistSchema = new mongoose.Schema({
    ordem: {
        type: Number,
        required: true
    },
    descricao: {
        type: String,
        required: true,
        trim: true
    },
    tipo_resposta: {
        type: String,
        required: true,
        enum: ['OK_NOK_NA', 'Numérico', 'Texto', 'Foto']
    },
    unidade_medida: String,
    limite_minimo: Number,
    limite_maximo: Number,
    obrigatorio: {
        type: Boolean,
        default: true
    },
    gera_nc_automatica: {
        type: Boolean,
        default: true
    },
    criticidade: {
        type: String,
        required: true,
        enum: ['Crítico', 'Maior', 'Menor'],
        default: 'Menor'
    },
    instrucao_item: String
});

const checklistModelSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'Código do modelo é obrigatório'],
        unique: true,
        trim: true,
        uppercase: true
    },
    titulo: {
        type: String,
        required: [true, 'Título do modelo é obrigatório'],
        trim: true
    },
    programa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PacProgram',
        required: true
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionArea',
        required: true
    },
    frequencia: {
        type: String,
        required: true,
        enum: ['Pre-operacional', 'Operacional', 'Diário', 'Semanal', 'Mensal']
    },
    turno: {
        type: [String],
        required: true,
        enum: ['A', 'B', 'C', 'Todos']
    },
    versao: {
        type: String,
        required: true,
        default: 'v1.0'
    },
    status: {
        type: String,
        required: true,
        enum: ['Ativo', 'Inativo', 'Em revisão'],
        default: 'Ativo'
    },
    aprovado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data_aprovacao: {
        type: Date,
        required: true,
        default: Date.now
    },
    tempo_guarda_meses: {
        type: Number,
        required: true,
        default: 12
    },
    instrucoes: String,
    itens: [itemChecklistSchema]
}, {
    timestamps: true
});

checklistModelSchema.plugin(softDeletePlugin);

const ChecklistModel = mongoose.model('ChecklistModel', checklistModelSchema);

export default ChecklistModel;
