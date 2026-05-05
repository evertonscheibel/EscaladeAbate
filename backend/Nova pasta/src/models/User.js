import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
        enum: ['N1', 'N2', 'N3'],
        description: 'Nível de suporte do técnico (apenas para técnicos/admins)'
    },
    active: {
        type: Boolean,
        default: true
    },
    isMaster: {
        type: Boolean,
        default: false,
        description: 'Define se o usuário tem acesso total às métricas gerenciais'
    },
    allowedModules: {
        type: [String],
        default: [
            'dashboard', 'tickets', 'knowledge-base', 'documents',
            'gestao-ti', 'gep', 'gestao-ativos', 'escala-abate',
            'slaughter', 'candidates', 'job-positions', 'gatehouse'
        ],
        description: 'Lista de slugs de módulos que o usuário pode acessar'
    }
}, {
    timestamps: true
});

// Hash password antes de salvar
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Método para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remover senha do JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
