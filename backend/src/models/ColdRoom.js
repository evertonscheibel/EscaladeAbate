import mongoose from 'mongoose';

const leituraSchema = new mongoose.Schema({
    temperatura: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const coldRoomSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome da câmara é obrigatório'],
        trim: true,
        unique: true
    },
    codigo: {
        type: String,
        trim: true
    },
    capacidadeKg: {
        type: Number,
        required: [true, 'Capacidade é obrigatória'],
        min: 0
    },
    ocupacaoAtualKg: {
        type: Number,
        default: 0,
        min: 0
    },
    temperaturaMin: {
        type: Number,
        default: -2
    },
    temperaturaMax: {
        type: Number,
        default: 4
    },
    temperaturaAtual: {
        type: Number,
        default: 0
    },
    tipo: {
        type: String,
        enum: ['RESFRIAMENTO', 'CONGELAMENTO', 'MATURACAO', 'ESPERA'],
        default: 'RESFRIAMENTO'
    },
    status: {
        type: String,
        enum: ['ATIVA', 'MANUTENCAO', 'INATIVA'],
        default: 'ATIVA'
    },
    leituras: [leituraSchema],
    observacoes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

coldRoomSchema.index({ nome: 1 });
coldRoomSchema.index({ status: 1 });

const ColdRoom = mongoose.model('ColdRoom', coldRoomSchema);
export default ColdRoom;
