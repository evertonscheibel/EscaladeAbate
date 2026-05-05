import mongoose from 'mongoose';

const gatehouseAccessSchema = new mongoose.Schema({
    ticket: {
        type: String,
        required: [true, 'Ticket é obrigatório'],
        unique: true
    },
    guarita_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gatehouse',
        required: [true, 'Guarita é obrigatória']
    },
    veiculo_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Veículo é obrigatório']
    },
    pessoa_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessPerson'
    },
    empresa_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    tipo_acesso_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessType',
        required: [true, 'Tipo de acesso é obrigatório']
    },
    motivo_acesso_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessReason'
    },
    destino: String,

    // Controle de tempo
    dt_entrada: {
        type: Date,
        default: Date.now,
        required: true
    },
    dt_saida: Date,
    permanencia_min: Number,

    // Status e controle
    status: {
        type: String,
        enum: ['NO_PATIO', 'FINALIZADO', 'CANCELADO'],
        default: 'NO_PATIO'
    },

    // Observações
    observacao_entrada: String,
    observacao_saida: String,
    houve_ocorrencia: {
        type: Boolean,
        default: false
    },
    descricao_ocorrencia: String,

    // Rastreabilidade
    device_id: String,
    device_info: {
        userAgent: String,
        ip: String,
        location: String
    },

    // Anexos
    anexos: [{
        fileName: String,
        filePath: String,
        fileSize: Number,
        uploadedAt: Date
    }],

    // Auditoria
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    closedAt: Date,
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Histórico de edições
    editHistory: [{
        editedAt: {
            type: Date,
            default: Date.now
        },
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        campo: String,
        valorAnterior: String,
        valorNovo: String,
        motivo: String
    }]
}, {
    timestamps: true
});

// Índices
gatehouseAccessSchema.index({ ticket: 1 }, { unique: true });
gatehouseAccessSchema.index({ status: 1 });
gatehouseAccessSchema.index({ veiculo_id: 1, status: 1 });
gatehouseAccessSchema.index({ dt_entrada: -1 });
gatehouseAccessSchema.index({ dt_saida: -1 });
gatehouseAccessSchema.index({ guarita_id: 1, dt_entrada: -1 });
gatehouseAccessSchema.index({ empresa_id: 1 });
gatehouseAccessSchema.index({ tipo_acesso_id: 1 });

const GatehouseAccess = mongoose.model('GatehouseAccess', gatehouseAccessSchema);

export default GatehouseAccess;
