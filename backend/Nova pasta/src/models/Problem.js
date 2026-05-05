import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Descrição é obrigatória']
    },
    category: {
        type: String,
        enum: ['hardware', 'software', 'rede', 'acesso', 'performance', 'seguranca', 'outros'],
        default: 'outros'
    },
    status: {
        type: String,
        enum: ['identificado', 'em_analise', 'resolvido', 'fechado'],
        default: 'identificado'
    },
    priority: {
        type: String,
        enum: ['baixa', 'media', 'alta', 'critica'],
        default: 'media'
    },
    impact: {
        type: String,
        enum: ['baixo', 'medio', 'alto', 'critico'],
        default: 'medio'
    },
    // Análise de causa raiz
    rootCause: {
        type: String
    },
    rootCauseAnalysis: {
        type: String
    },
    // Solução de contorno temporária
    workaround: {
        type: String
    },
    // Solução permanente
    permanentSolution: {
        type: String
    },
    // Incidentes relacionados (tickets)
    relatedIncidents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],
    // Responsável pela análise
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Criador do problema
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Datas importantes
    identifiedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    closedAt: Date,
    // Ativos afetados
    affectedAssets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    }],
    // Notas e observações
    notes: String,
    // Mudança relacionada (se houver)
    relatedChange: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Change'
    }
}, {
    timestamps: true
});

// Índices para performance
problemSchema.index({ status: 1 });
problemSchema.index({ priority: 1 });
problemSchema.index({ category: 1 });
problemSchema.index({ createdAt: -1 });

// Virtual para contar incidentes
problemSchema.virtual('incidentCount').get(function () {
    return this.relatedIncidents ? this.relatedIncidents.length : 0;
});

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
