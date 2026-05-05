import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String, // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'DOWNLOAD', 'COPY_PASSWORD', etc.
        required: true,
        index: true
    },
    resource: {
        type: String, // 'TICKET', 'ASSET', 'CREDENTIAL', 'SLOT', etc.
        required: true,
        index: true
    },
    resourceId: {
        type: String, // ID do documento afetado
        index: true
    },
    oldData: {
        type: mongoose.Schema.Types.Mixed // Snapshot antes da alteração (opcional)
    },
    newData: {
        type: mongoose.Schema.Types.Mixed // Snapshot após a alteração (opcional)
    },
    ipAddress: String,
    userAgent: String,
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical', 'info'],
        default: 'info'
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    details: String,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // Já temos createdAt
});

// TTL de 1 ano para logs (pode ser ajustado conforme compliance)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
