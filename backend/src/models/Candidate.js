import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
    // Dados Pessoais
    fullName: {
        type: String,
        required: [true, 'Nome completo é obrigatório'],
        trim: true
    },
    cpf: {
        type: String,
        required: [true, 'CPF é obrigatório'],
        unique: true,
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, 'Data de nascimento é obrigatória']
    },
    gender: {
        type: String,
        enum: ['masculino', 'feminino', 'outro', 'prefiro_nao_informar'],
        default: 'prefiro_nao_informar'
    },
    maritalStatus: {
        type: String,
        enum: ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro'],
        default: 'solteiro'
    },

    // Contato
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
    },
    whatsapp: {
        type: String,
        trim: true
    },

    // Endereço
    address: {
        street: { type: String, trim: true },
        number: { type: String, trim: true },
        complement: { type: String, trim: true },
        neighborhood: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        zipCode: { type: String, trim: true }
    },

    // Informações Profissionais
    desiredPosition: {
        type: String,
        required: [true, 'Cargo desejado é obrigatório'],
        trim: true
    },
    jobPosition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosition'
    },
    desiredSalary: {
        type: Number
    },
    availableStartDate: {
        type: Date
    },
    workShift: {
        type: String,
        enum: ['manha', 'tarde', 'noite', 'integral', 'flexivel'],
        default: 'integral'
    },

    // Qualificação
    education: {
        type: String,
        enum: [
            'fundamental_incompleto',
            'fundamental_completo',
            'medio_incompleto',
            'medio_completo',
            'tecnico',
            'superior_incompleto',
            'superior_completo',
            'pos_graduacao',
            'mestrado_doutorado'
        ],
        default: 'medio_completo'
    },
    courses: {
        type: String,
        trim: true
    },
    languages: {
        type: String,
        trim: true
    },
    skills: {
        type: String,
        trim: true
    },

    // Experiência Profissional
    experiences: [{
        company: { type: String, trim: true },
        position: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        currentJob: { type: Boolean, default: false },
        description: { type: String, trim: true }
    }],

    // Status do Processo
    status: {
        type: String,
        enum: [
            'novo',
            'em_analise',
            'pre_selecionado',
            'aguardando_entrevista',
            'entrevistado',
            'aprovado',
            'reprovado',
            'desistente',
            'contratado'
        ],
        default: 'novo'
    },
    priority: {
        type: String,
        enum: ['normal', 'alta', 'urgente'],
        default: 'normal'
    },
    source: {
        type: String,
        enum: ['site', 'indicacao', 'linkedin', 'agencia', 'outro'],
        default: 'site'
    },

    // Atribuição
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Entrevistas
    interviews: [{
        scheduledDate: { type: Date, required: true },
        type: {
            type: String,
            enum: ['telefone', 'presencial', 'video', 'tecnica'],
            default: 'presencial'
        },
        interviewer: { type: String, trim: true },
        location: { type: String, trim: true },
        notes: { type: String, trim: true },
        status: {
            type: String,
            enum: ['agendada', 'realizada', 'cancelada', 'remarcada', 'no_show'],
            default: 'agendada'
        },
        feedback: { type: String, trim: true },
        rating: { type: Number, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now }
    }],

    // Notas e Observações
    notes: [{
        content: { type: String, required: true },
        author: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    // Documentos
    documents: [{
        name: { type: String, required: true },
        type: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Avaliação
    overallRating: {
        type: Number,
        min: 1,
        max: 5
    },

    // Protocolo
    protocol: {
        type: String,
        unique: true
    },

    // LGPD
    lgpdConsent: {
        type: Boolean,
        required: [true, 'Consentimento LGPD é obrigatório'],
        default: false
    },
    lgpdConsentDate: {
        type: Date
    },
    dataRetentionDays: {
        type: Number,
        default: 180
    },

    // Observações gerais
    observations: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Gerar protocolo antes de salvar
candidateSchema.pre('save', function (next) {
    if (!this.protocol) {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        this.protocol = `ATS-${year}-${random}`;
    }
    if (this.lgpdConsent && !this.lgpdConsentDate) {
        this.lgpdConsentDate = new Date();
    }
    next();
});

// Índices para busca
candidateSchema.index({ fullName: 'text', email: 'text', cpf: 'text', desiredPosition: 'text' });
candidateSchema.index({ status: 1 });
candidateSchema.index({ createdAt: -1 });
candidateSchema.index({ assignedTo: 1 });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
