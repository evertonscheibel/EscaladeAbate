import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const productionAreaSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'Código da área é obrigatório'],
        unique: true,
        trim: true,
        uppercase: true
    },
    nome: {
        type: String,
        required: [true, 'Nome da área é obrigatório'],
        trim: true
    },
    setor: {
        type: String,
        required: [true, 'Setor é obrigatório'],
        enum: ['Abate', 'Processamento', 'Estoque', 'Expedição', 'Utilidades']
    },
    qr_code: {
        type: String,
        required: [true, 'QR Code único é obrigatório'],
        unique: true
    },
    responsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Responsável da área é obrigatório']
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

productionAreaSchema.plugin(softDeletePlugin);

const ProductionArea = mongoose.model('ProductionArea', productionAreaSchema);

export default ProductionArea;
