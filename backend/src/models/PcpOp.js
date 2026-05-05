import mongoose from 'mongoose';

const pcpOpSchema = new mongoose.Schema({
    programacaoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeboningSchedule',
        required: true,
        index: true
    },
    sequencia: {
        type: Number,
        required: true
    },
    itemCorte: {
        type: String,
        required: true
    },
    qtdPlanejada: {
        type: Number,
        required: true
    },
    pesoPlanejadoKg: {
        type: Number,
        required: true
    },
    destino: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDENTE', 'EM_EXECUCAO', 'PAUSADA', 'FINALIZADA'],
        default: 'PENDENTE',
        index: true
    },
    inicioReal: Date,
    fimReal: Date,
    qtdReal: { type: Number, default: 0 },
    pesoRealKg: { type: Number, default: 0 },
    origemEntradaKg: { type: Number, default: 0 },
    rendimentoPct: { type: Number, default: 0 },

    // Indicadores de tempo (calculados)
    tempoTotalMin: { type: Number, default: 0 },
    tempoParadoMin: { type: Number, default: 0 },
    tempoProdutivoMin: { type: Number, default: 0 },
    pecasPorHora: { type: Number, default: 0 },
    kgPorHora: { type: Number, default: 0 },

    observacao: String
}, { timestamps: true });

pcpOpSchema.index({ programacaoId: 1, sequencia: 1 }, { unique: true });

const PcpOp = mongoose.model('PcpOp', pcpOpSchema);
export default PcpOp;
