import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    placa: {
        type: String,
        required: [true, 'Placa é obrigatória'],
        unique: true,
        uppercase: true,
        trim: true
    },
    tipo_veiculo: {
        type: String,
        enum: ['caminhao', 'carro', 'moto', 'utilitario', 'carreta', 'outros'],
        required: [true, 'Tipo de veículo é obrigatório']
    },
    marca_modelo: {
        type: String,
        trim: true
    },
    cor: {
        type: String,
        trim: true
    },
    frota_propria: {
        type: Boolean,
        default: false
    },
    empresa_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    recorrente: {
        type: Boolean,
        default: false
    },
    observacoes: String,
    ativo: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Índices
vehicleSchema.index({ recorrente: 1, ativo: 1 });
vehicleSchema.index({ empresa_id: 1 });
vehicleSchema.index({ tipo_veiculo: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
