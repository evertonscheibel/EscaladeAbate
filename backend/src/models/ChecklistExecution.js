import mongoose from 'mongoose';

const respostaItemSchema = new mongoose.Schema({
    item_ref: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    resultado: {
        type: String,
        required: true,
        enum: ['OK', 'NOK', 'N/A']
    },
    valor_medido: Number,
    texto_resposta: String,
    foto: String, // Caminho do arquivo
    observacao: String,
    nc_gerada: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NonConformity'
    },
    data_hora_resposta: {
        type: Date,
        default: Date.now
    }
});

const checklistExecutionSchema = new mongoose.Schema({
    codigo_execucao: {
        type: String,
        required: true,
        unique: true
    },
    modelo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChecklistModel',
        required: true
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionArea',
        required: true
    },
    turno: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C']
    },
    data_hora_abertura: {
        type: Date,
        default: Date.now
    },
    data_hora_fechamento: Date,
    executor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        required: true,
        enum: ['Em andamento', 'Finalizado', 'Finalizado com NC', 'Cancelado'],
        default: 'Em andamento'
    },
    observacao_geral: String,
    hash_integridade: String,
    tem_nc: {
        type: Boolean,
        default: false
    },
    total_itens: { type: Number, default: 0 },
    total_ok: { type: Number, default: 0 },
    total_nok: { type: Number, default: 0 },
    total_na: { type: Number, default: 0 },
    respostas: [respostaItemSchema]
}, {
    timestamps: true
});

const ChecklistExecution = mongoose.model('ChecklistExecution', checklistExecutionSchema);

export default ChecklistExecution;
