import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'tecnico', 'cliente', 'guarita_admin', 'guarita_supervisor', 'guarita_operador'],
        default: 'cliente'
    },
    supportLevel: {
        type: String,
        enum: ['N1', 'N2', 'N3', 'FIELD'],
        description: 'Nível de suporte do técnico (apenas para técnicos/admins)'
    },
    active: {
        type: Boolean,
        default: true
    },
    // Proteção contra brute force
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    isMaster: {
        type: Boolean,
        default: false,
        description: 'Define se o usuário tem acesso total às métricas gerenciais'
    },
    allowedModules: {
        type: [String],
        default: [
            'dashboard', 'tickets', 'metrics/my-performance', 'knowledge-base', 'documents', 'gestao-ti',
            'assets', 'candidates', 'job-positions', 'gatehouse', 'noc', 'gep',
            'network', 'credentials', 'purchase-requests', 'reports', 'problems', 'maintenance', 'settings', 'users', 'permission-profiles',
            'quality', 'quality/non-conformities', 'quality/audit-packages', 'quality/models',
            'slaughter', 'escala-abate', 'desossa', 'pcp', 'industria', 'gep'
        ],
        description: 'Lista de slugs de módulos que o usuário pode acessar'
    },

    // =============================================
    // NOVOS CAMPOS — Adicionado para Gestão Granular
    // =============================================

    // Dados do colaborador
    department: {
        type: String,
        trim: true,
        enum: {
            values: [
                'PRODUCAO', 'ADMINISTRATIVO', 'MANUTENCAO', 'TI',
                'RH', 'SEGURANCA', 'QUALIDADE', 'LOGISTICA',
                'COMERCIAL', 'FINANCEIRO', 'COMPRAS', 'DIRETORIA'
            ],
            message: 'Departamento inválido'
        },
        description: 'Setor/departamento do colaborador na Frizelo'
    },
    position: {
        type: String,
        trim: true,
        maxlength: 100,
        description: 'Cargo do colaborador (texto livre)'
    },
    phone: {
        type: String,
        trim: true,
        maxlength: 20
    },
    employeeId: {
        type: String,
        trim: true,
        sparse: true,
        description: 'Matrícula ou RE do colaborador (opcional)'
    },
    avatar: {
        type: String,
        default: null,
        description: 'URL da foto do colaborador'
    },

    // Perfil de permissão vinculado
    permissionProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PermissionProfile',
        default: null,
        description: 'Perfil base de permissões'
    },

    // Permissões granulares customizadas
    // Se preenchido, SOBRESCREVE as permissões do perfil para aquele módulo
    permissions: {
        type: Map,
        of: [String],
        default: new Map(),
        description: 'Permissões customizadas por módulo. Chave = slug do módulo, valor = array de ações'
    },

    // Flag: customizações foram feitas por cima do perfil?
    hasCustomPermissions: {
        type: Boolean,
        default: false,
        description: 'Indica que as permissões foram customizadas além do perfil base'
    },

    // Controle de primeiro acesso
    mustChangePassword: {
        type: Boolean,
        default: false,
        description: 'Forçar troca de senha no próximo login'
    },

    // Desativação com motivo
    deactivatedAt: {
        type: Date,
        default: null
    },
    deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    deactivationReason: {
        type: String,
        trim: true,
        maxlength: 200
    },

    // Histórico de sessões (últimas 10)
    loginHistory: {
        type: [{
            at: { type: Date },
            ip: { type: String },
            userAgent: { type: String },
            _id: false
        }],
        default: [],
        select: false
    }

}, {
    timestamps: true
});

// Adicionar índices para novos campos
userSchema.index({ department: 1 });
userSchema.index({ permissionProfile: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true, unique: true });


// Hash password antes de salvar
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    // Aumentando rounds para 12 conforme solicitado
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Método para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Resolve as permissões efetivas do usuário para um módulo.
 * Prioridade: permissions customizadas > perfil > fallback por role
 *
 * @param {string} moduleName - slug do módulo (ex: 'desossa')
 * @returns {string[]} - array de ações permitidas (ex: ['view', 'create', 'edit'])
 */
userSchema.methods.getEffectivePermissions = async function (moduleName) {
    // 1. Verificar se tem permissões customizadas para este módulo
    if (this.permissions && this.permissions.has(moduleName)) {
        return this.permissions.get(moduleName);
    }

    // Admin sempre tem tudo se não houver restrição específica
    if (this.role === 'admin') {
        return ['view', 'create', 'edit', 'close', 'reopen', 'delete', 'export', 'manage'];
    }

    // 2. Verificar se tem perfil de permissão vinculado
    if (this.permissionProfile) {
        const profile = await mongoose.model('PermissionProfile')
            .findById(this.permissionProfile)
            .lean();
        if (profile && profile.permissions && profile.permissions[moduleName]) {
            return profile.permissions[moduleName];
        }
    }

    // 3. Fallback por role
    if (this.role === 'tecnico') {
        return ['view', 'create', 'edit', 'export'];
    }

    // 4. Default: somente leitura
    return ['view'];
};

/**
 * Resolve TODAS as permissões efetivas do usuário (todos os módulos).
 * Usado na tela de edição para mostrar o grid completo.
 *
 * @returns {Object} - { modulo: [ações], ... }
 */
userSchema.methods.getAllEffectivePermissions = async function () {
    const result = {};

    // Prioridade 1: Customizações explícitas (mesmo para admin)
    if (this.permissions) {
        const customPerms = this.permissions instanceof Map
            ? Object.fromEntries(this.permissions)
            : this.permissions;
        Object.assign(result, customPerms);
    }

    // Se é admin, preencher o resto com tudo
    if (this.role === 'admin') {
        const allModules = this.allowedModules || [];
        const allActions = ['view', 'create', 'edit', 'close', 'reopen', 'delete', 'export', 'manage'];
        allModules.forEach(m => {
            if (!result[m]) result[m] = allActions;
        });
        return result;
    }

    // Montar base do perfil
    if (this.permissionProfile) {
        const profile = await mongoose.model('PermissionProfile')
            .findById(this.permissionProfile)
            .lean();
        if (profile && profile.permissions) {
            // profile.permissions é um Map serializado como Object ou Map
            const permsObj = profile.permissions instanceof Map
                ? Object.fromEntries(profile.permissions)
                : profile.permissions;
            Object.assign(result, permsObj);
        }
    }

    // Sobrescrever com customizações (já feito acima, mas garantindo ordem se não for admin)
    if (this.permissions) {
        const customPerms = this.permissions instanceof Map
            ? Object.fromEntries(this.permissions)
            : this.permissions;
        Object.assign(result, customPerms);
    }

    // Preencher módulos sem permissão explícita com fallback
    const modules = this.allowedModules || [];
    for (const mod of modules) {
        if (!result[mod]) {
            if (this.role === 'tecnico') {
                result[mod] = ['view', 'create', 'edit', 'export'];
            } else if (this.role === 'guarita_operador') {
                result[mod] = ['view', 'edit', 'close', 'export'];
            } else {
                result[mod] = ['view'];
            }
        }
    }

    return result;
};

// Remover senha do JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Aplicar plugin de Soft Delete
userSchema.plugin(softDeletePlugin);

const User = mongoose.model('User', userSchema);

export default User;
