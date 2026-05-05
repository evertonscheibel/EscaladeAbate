import React, { useState, useEffect } from 'react';
import { kbService } from '../services';
import { BookOpen } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface KBModalProps {
    article: any | null;
    onClose: () => void;
    onSave: () => void;
    viewMode?: boolean;
}

export const KBModal: React.FC<KBModalProps> = ({ article, onClose, onSave, viewMode = false }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'geral',
        tags: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (article) {
            setFormData({
                title: article.title || '',
                content: article.content || '',
                category: article.category || 'geral',
                tags: article.tags ? article.tags.join(', ') : ''
            });
        }
    }, [article]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            if (article) {
                await kbService.update(article._id, dataToSend);
            } else {
                await kbService.create(dataToSend);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar artigo:', error);
            alert('Erro ao salvar artigo');
        } finally {
            setLoading(false);
        }
    };

    const footerContent = viewMode ? (
        <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
            Fechar
        </button>
    ) : (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button
                type="submit"
                form="kb-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                {loading ? 'Salvando...' : article ? 'Atualizar' : 'Criar Artigo'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={viewMode ? article?.title : (article ? 'Editar Artigo' : 'Novo Artigo')}
            icon={<BookOpen size={22} />}
            size="md"
            footer={footerContent}
        >
            {viewMode ? (
                <div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '6px 12px', background: 'var(--surface, #f1f5f9)', borderRadius: '6px', fontSize: '14px', color: 'var(--text-muted, #475569)', fontWeight: '500' }}>
                            📁 {formData.category}
                        </span>
                        {formData.tags && formData.tags.split(',').map((tag, i) => (
                            <span key={i} style={{ padding: '6px 12px', background: '#e0e7ff', borderRadius: '6px', fontSize: '14px', color: '#4f46e5' }}>
                                {tag.trim()}
                            </span>
                        ))}
                    </div>
                    <div style={{
                        background: 'var(--surface, #f8fafc)',
                        padding: '24px',
                        borderRadius: '8px',
                        lineHeight: '1.8',
                        fontSize: '15px',
                        color: 'var(--text, #334155)',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {formData.content}
                    </div>
                </div>
            ) : (
                <form id="kb-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Título *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Ex: Como configurar a impressora"
                            />
                        </div>

                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="geral">Geral</option>
                                <option value="hardware">Hardware</option>
                                <option value="software">Software</option>
                                <option value="rede">Rede</option>
                                <option value="procedimentos">Procedimentos</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Tags (separadas por vírgula)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="Ex: impressora, configuração, rede"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Conteúdo *</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                rows={10}
                                placeholder="Escreva o conteúdo do artigo aqui..."
                            />
                        </div>
                    </div>
                </form>
            )}
        </StandardFormModal>
    );
};
