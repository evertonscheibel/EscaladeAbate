import mongoose from 'mongoose';

const auditPackageSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: true,
        unique: true
    },
    titulo: {
        type: String,
        required: true
    },
    periodo_inicio: {
        type: Date,
        required: true
    },
    periodo_fim: {
        type: Date,
        required: true
    },
    programas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PacProgram'
    }],
    areas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionArea'
    }],
    gerado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data_geracao: {
        type: Date,
        default: Date.now
    },
    arquivo_pdf: String,
    qr_validacao: String,
    motivo: {
        type: String,
        required: true,
        enum: ['Auditoria SIF', 'Auditoria Interna', 'Auditoria Cliente', 'Renovação', 'Rotina']
    },
    auditor: String,
    status: {
        type: String,
        required: true,
        enum: ['Gerado', 'Impresso', 'Arquivado'],
        default: 'Gerado'
    }
}, {
    timestamps: true
});

const AuditPackage = mongoose.model('AuditPackage', auditPackageSchema);

export default AuditPackage;
