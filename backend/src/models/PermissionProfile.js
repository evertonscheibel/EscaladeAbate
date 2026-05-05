import mongoose from 'mongoose';

const permissionProfileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do perfil é obrigatório'],
        unique: true,
        trim: true,
        maxlength: 60
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },
    // Cor do badge para identificação visual
    color: {
        type: String,
        default: '#667eea'
    },
    icon: {
        type: String,
        default: 'Shield'  // nome do ícone lucide-react
    },
    // Role padrão que este perfil atribui
    defaultRole: {
        type: String,
        enum: ['admin', 'tecnico', 'cliente', 'guarita_admin', 'guarita_supervisor', 'guarita_operador'],
        default: 'cliente'
    },
    // Módulos que o perfil dá acesso (preenche allowedModules)
    modules: {
        type: [String],
        default: ['dashboard']
    },
    // Permissões granulares: Map de módulo → array de ações
    permissions: {
        type: Map,
        of: [String],
        default: new Map()
    },
    // Quem pode usar este perfil para atribuir a usuários
    assignableBy: {
        type: [String],
        enum: ['admin', 'tecnico'],
        default: ['admin']
    },
    isSystem: {
        type: Boolean,
        default: false,
        description: 'Perfis de sistema não podem ser excluídos'
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

permissionProfileSchema.index({ name: 1 }, { unique: true });
permissionProfileSchema.index({ active: 1 });

const PermissionProfile = mongoose.model('PermissionProfile', permissionProfileSchema);
export default PermissionProfile;
