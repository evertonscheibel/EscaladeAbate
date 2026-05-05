import mongoose from 'mongoose';

const assetTimelineSchema = new mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: [true, 'Ativo é obrigatório'],
        index: true
    },
    eventType: {
        type: String,
        enum: [
            'aquisicao',
            'alocacao',
            'transferencia',
            'manutencao',
            'atualizacao',
            'baixa',
            'descarte',
            'roubo_perda',
            'devolucao',
            'upgrade',
            'incidente',
            'mudanca'
        ],
        required: [true, 'Tipo de evento é obrigatório']
    },
    itilCategory: {
        type: String,
        enum: [
            'incident',           // Incidente
            'service_request',    // Requisição de Serviço
            'change',            // Mudança
            'problem',           // Problema
            'configuration',     // Gerenciamento de Configuração
            'asset_management',  // Gerenciamento de Ativo
            'release'            // Liberação
        ],
        default: 'asset_management'
    },
    cobitProcess: {
        type: String,
        enum: [
            'BAI09',  // Gerenciar Ativos
            'BAI10',  // Gerenciar Configuração
            'DSS01',  // Gerenciar Operações
            'DSS02',  // Gerenciar Requisições e Incidentes
            'DSS03',  // Gerenciar Problemas
            'DSS04',  // Gerenciar Continuidade
            'APO09',  // Gerenciar Acordos de Serviço
            'MEA01'   // Monitorar, Avaliar e Analisar Desempenho
        ]
    },
    eventDate: {
        type: Date,
        required: [true, 'Data do evento é obrigatória'],
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Usuário responsável é obrigatório']
    },
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Descrição é obrigatória']
    },
    previousData: {
        type: mongoose.Schema.Types.Mixed
    },
    newData: {
        type: mongoose.Schema.Types.Mixed
    },
    location: {
        from: String,
        to: String
    },
    responsible: {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    relatedMaintenance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Maintenance'
    },
    relatedTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    impact: {
        type: String,
        enum: ['baixo', 'medio', 'alto', 'critico'],
        default: 'baixo'
    },
    cost: {
        type: Number,
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Índices para performance e queries analíticas
assetTimelineSchema.index({ asset: 1, eventDate: -1 });
assetTimelineSchema.index({ eventType: 1 });
assetTimelineSchema.index({ itilCategory: 1 });
assetTimelineSchema.index({ cobitProcess: 1 });
assetTimelineSchema.index({ eventDate: -1 });
assetTimelineSchema.index({ user: 1 });

const AssetTimeline = mongoose.model('AssetTimeline', assetTimelineSchema);

export default AssetTimeline;
