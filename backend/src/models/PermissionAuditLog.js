import mongoose from 'mongoose';

const permissionAuditLogSchema = new mongoose.Schema({
    // Usuário que foi alterado
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    targetUserName: {
        type: String,
        required: true
    },
    // Quem fez a alteração
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    changedByName: {
        type: String,
        required: true
    },
    // Tipo de ação
    action: {
        type: String,
        enum: [
            'USER_CREATED',
            'USER_UPDATED',
            'USER_DEACTIVATED',
            'USER_REACTIVATED',
            'ROLE_CHANGED',
            'MODULES_CHANGED',
            'PERMISSIONS_CHANGED',
            'PROFILE_ASSIGNED',
            'PROFILE_REMOVED',
            'PASSWORD_RESET_BY_ADMIN',
            'FORCE_PASSWORD_CHANGE',
            'USER_LOCKED',
            'USER_UNLOCKED'
        ],
        required: true,
        index: true
    },
    // Snapshot antes da alteração
    before: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Snapshot depois da alteração
    after: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Detalhes adicionais legíveis
    details: {
        type: String,
        maxlength: 500
    },
    // IP e User-Agent de quem fez a alteração
    ip: { type: String },
    userAgent: { type: String }
}, {
    timestamps: true
});

// Índices para consulta
permissionAuditLogSchema.index({ createdAt: -1 });
permissionAuditLogSchema.index({ targetUser: 1, createdAt: -1 });
permissionAuditLogSchema.index({ action: 1, createdAt: -1 });

// TTL: manter logs por 2 anos (730 dias)
permissionAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const PermissionAuditLog = mongoose.model('PermissionAuditLog', permissionAuditLogSchema);
export default PermissionAuditLog;
