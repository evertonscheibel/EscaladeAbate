import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin.js';

const contactPersonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    }
});

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    tradeName: {
        type: String,
        trim: true
    },
    cnpj: {
        type: String,
        required: [true, 'CNPJ é obrigatório'],
        unique: true,
        trim: true
    },
    contact: {
        email: {
            type: String,
            required: [true, 'Email é obrigatório'],
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: [true, 'Telefone é obrigatório'],
            trim: true
        },
        website: {
            type: String,
            trim: true
        },
        address: {
            street: String,
            number: String,
            complement: String,
            neighborhood: String,
            city: String,
            state: String,
            zipCode: String
        }
    },
    categories: [{
        type: String,
        enum: ['hardware', 'software', 'servico', 'consumivel', 'outro']
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    performance: {
        totalOrders: {
            type: Number,
            default: 0
        },
        onTimeDelivery: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        qualityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        averageResponseTime: {
            type: Number, // em horas
            default: 0
        }
    },
    paymentTerms: {
        type: String,
        default: 'A combinar'
    },
    status: {
        type: String,
        enum: ['ativo', 'inativo', 'bloqueado'],
        default: 'ativo'
    },
    notes: String,
    contacts: [contactPersonSchema]
}, {
    timestamps: true
});

// Índices para performance

supplierSchema.index({ status: 1 });
supplierSchema.index({ categories: 1 });
supplierSchema.index({ rating: -1 });

// Aplicar plugin de Soft Delete
supplierSchema.plugin(softDeletePlugin);

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
