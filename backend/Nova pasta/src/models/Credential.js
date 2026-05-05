import mongoose from 'mongoose';
import crypto from 'crypto';

// Chave de criptografia (em produção, usar variável de ambiente)
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || 'frizelo-ti-2025-secure-key-32ch';
const IV_LENGTH = 16;

// Funções de criptografia
function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return '';
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Erro ao descriptografar:', error);
        return '';
    }
}

const accessLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['view', 'copy', 'edit', 'create', 'delete'],
        required: true
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const credentialSchema = new mongoose.Schema({
    // Identificação
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: [
            'servidor',
            'rede',
            'aplicacao',
            'banco_dados',
            'cloud',
            'vpn',
            'email',
            'api',
            'certificado',
            'wifi',
            'outro'
        ],
        default: 'outro'
    },
    
    // Credenciais (criptografadas)
    username: {
        type: String,
        trim: true
    },
    passwordEncrypted: {
        type: String
    },
    
    // Informações de conexão
    host: {
        type: String,
        trim: true
    },
    port: {
        type: Number
    },
    url: {
        type: String,
        trim: true
    },
    
    // Campos extras (criptografados)
    extraFields: [{
        label: { type: String },
        valueEncrypted: { type: String },
        isSecret: { type: Boolean, default: false }
    }],
    
    // Notas (podem conter informações sensíveis, então criptografar)
    notesEncrypted: {
        type: String
    },
    
    // Vinculações
    relatedAsset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    },
    relatedNetworkDevice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NetworkDevice'
    },
    relatedSupplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    
    // Controle de acesso
    visibility: {
        type: String,
        enum: ['private', 'team', 'all'],
        default: 'team'
    },
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Política de senha
    passwordPolicy: {
        expiresAt: { type: Date },
        requiresRotation: { type: Boolean, default: false },
        rotationDays: { type: Number, default: 90 },
        lastRotation: { type: Date }
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked', 'archived'],
        default: 'active'
    },
    
    // Tags para organização
    tags: [{
        type: String,
        trim: true
    }],
    
    // Auditoria
    accessLog: [accessLogSchema],
    lastAccessed: {
        type: Date
    },
    accessCount: {
        type: Number,
        default: 0
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
credentialSchema.index({ title: 'text', description: 'text' });
credentialSchema.index({ category: 1 });
credentialSchema.index({ status: 1 });
credentialSchema.index({ owner: 1 });
credentialSchema.index({ tags: 1 });

// Métodos para criptografia
credentialSchema.methods.setPassword = function(plainPassword) {
    this.passwordEncrypted = encrypt(plainPassword);
};

credentialSchema.methods.getPassword = function() {
    return decrypt(this.passwordEncrypted);
};

credentialSchema.methods.setNotes = function(plainNotes) {
    this.notesEncrypted = encrypt(plainNotes);
};

credentialSchema.methods.getNotes = function() {
    return decrypt(this.notesEncrypted);
};

credentialSchema.methods.addExtraField = function(label, value, isSecret = false) {
    this.extraFields.push({
        label,
        valueEncrypted: isSecret ? encrypt(value) : value,
        isSecret
    });
};

credentialSchema.methods.getExtraFields = function() {
    return this.extraFields.map(field => ({
        label: field.label,
        value: field.isSecret ? decrypt(field.valueEncrypted) : field.valueEncrypted,
        isSecret: field.isSecret
    }));
};

// Método para registrar acesso
credentialSchema.methods.logAccess = function(userId, action, ipAddress, userAgent) {
    this.accessLog.push({
        user: userId,
        action,
        ipAddress,
        userAgent
    });
    this.lastAccessed = new Date();
    this.accessCount += 1;
    
    // Manter apenas os últimos 100 registros de acesso
    if (this.accessLog.length > 100) {
        this.accessLog = this.accessLog.slice(-100);
    }
};

// Virtual para verificar se a senha expirou
credentialSchema.virtual('isExpired').get(function() {
    if (!this.passwordPolicy.expiresAt) return false;
    return new Date() > this.passwordPolicy.expiresAt;
});

// Virtual para verificar se precisa de rotação
credentialSchema.virtual('needsRotation').get(function() {
    if (!this.passwordPolicy.requiresRotation) return false;
    if (!this.passwordPolicy.lastRotation) return true;
    
    const daysSinceRotation = Math.floor(
        (new Date() - this.passwordPolicy.lastRotation) / (1000 * 60 * 60 * 24)
    );
    return daysSinceRotation >= this.passwordPolicy.rotationDays;
});

// Exportar também as funções de criptografia para uso externo
export { encrypt, decrypt };

const Credential = mongoose.model('Credential', credentialSchema);

export default Credential;
