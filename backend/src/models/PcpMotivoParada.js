import mongoose from 'mongoose';

const pcpMotivoParadaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    categoria: {
        type: String,
        enum: ['MANUTENCAO', 'QUALIDADE', 'MP', 'PESSOAS', 'SETUP', 'LIMPEZA', 'LOGISTICA', 'OUTROS'],
        required: true
    },
    improdutivo: {
        type: Boolean,
        default: true
    },
    exigeObservacao: {
        type: Boolean,
        default: false
    },
    abreTicket: {
        type: Boolean,
        default: false
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const PcpMotivoParada = mongoose.model('PcpMotivoParada', pcpMotivoParadaSchema);
export default PcpMotivoParada;
