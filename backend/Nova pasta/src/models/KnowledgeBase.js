import mongoose from 'mongoose';

const kbAttachmentSchema = new mongoose.Schema({
    fileName: String,
    filePath: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const knowledgeBaseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Conteúdo é obrigatório']
    },
    category: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    attachments: [kbAttachmentSchema],
    published: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índices para busca
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });
knowledgeBaseSchema.index({ category: 1 });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
