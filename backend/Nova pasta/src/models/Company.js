import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    nome_fantasia: {
        type: String,
        required: [true, 'Nome fantasia é obrigatório'],
        trim: true
    },
    razao_social: {
        type: String,
        trim: true
    },
    cnpj: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    tipo: {
        type: String,
        enum: ['fornecedor', 'cliente', 'prestador', 'outros'],
        default: 'outros'
    },
    telefone: String,
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    endereco: String,
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índices
companySchema.index({ nome_fantasia: 1 });
companySchema.index({ ativo: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
