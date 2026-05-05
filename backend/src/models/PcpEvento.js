import mongoose from 'mongoose';

const pcpEventoSchema = new mongoose.Schema({
    programacaoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeboningSchedule',
        required: true,
        index: true
    },
    opId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PcpOp',
        index: true
    },
    tipo: {
        type: String,
        enum: ['START', 'STOP', 'RESUME', 'FINISH', 'ADJUST_ENDTIME'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    motivoParadaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PcpMotivoParada'
    },
    observacao: String,
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const PcpEvento = mongoose.model('PcpEvento', pcpEventoSchema);
export default PcpEvento;
