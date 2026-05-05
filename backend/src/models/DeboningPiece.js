import mongoose from 'mongoose';

const deboningPieceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome da peça é obrigatório'],
        unique: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['TRASEIRO', 'DIANTEIRO', 'PONTA_AGULHA', 'MIUDOS', 'OUTROS'],
        default: 'OUTROS'
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const DeboningPiece = mongoose.model('DeboningPiece', deboningPieceSchema);

export default DeboningPiece;
