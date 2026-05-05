import React, { useEffect, useState } from 'react';
import { kbService } from '../services';
import { Plus, Search, Eye, BookOpen, Edit, Trash2 } from 'lucide-react';
import { KBModal } from '../components/KBModal';
import '../pages/Tickets.css';

export const KnowledgeBase: React.FC = () => {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState(false);

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        try {
            const response = await kbService.getAll();
            setArticles(response.data);
        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateArticle = () => {
        setSelectedArticle(null);
        setViewMode(false);
        setShowModal(true);
    };

    const handleViewArticle = (article: any) => {
        setSelectedArticle(article);
        setViewMode(true);
        setShowModal(true);
        // Incrementar visualizações
        kbService.incrementViews(article._id).catch(console.error);
    };

    const handleEditArticle = (article: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedArticle(article);
        setViewMode(false);
        setShowModal(true);
    };

    const handleDeleteArticle = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este artigo?')) return;

        try {
            await kbService.delete(id);
            loadArticles();
        } catch (error) {
            console.error('Erro ao excluir artigo:', error);
            alert('Erro ao excluir artigo');
        }
    };

    const handleSave = () => {
        loadArticles();
    };

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando artigos...</p></div>;
    }

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Base de Conhecimento</h1>
                    <p>{filteredArticles.length} artigo(s)</p>
                </div>
                <button className="btn-primary" onClick={handleCreateArticle}>
                    <Plus size={20} />
                    Novo Artigo
                </button>
            </div>

            <div className="tickets-toolbar">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar artigos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', padding: '24px 0' }}>
                {filteredArticles.map((article) => (
                    <div key={article._id} onClick={() => handleViewArticle(article)} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                            <button className="btn-icon" onClick={(e) => handleEditArticle(article, e)} style={{ width: '28px', height: '28px' }}>
                                <Edit size={14} />
                            </button>
                            <button className="btn-icon danger" onClick={(e) => handleDeleteArticle(article._id, e)} style={{ width: '28px', height: '28px' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <BookOpen size={24} />
                            </div>
                            <div style={{ flex: 1, paddingRight: '60px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{article.title}</h3>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>{article.category}</span>
                            </div>
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                            {article.content.substring(0, 150)}...
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {article.tags?.slice(0, 3).map((tag: string, i: number) => (
                                    <span key={i} style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', color: '#475569' }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#667eea', fontSize: '14px', fontWeight: '600' }}>
                                <Eye size={16} />
                                {article.views}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <KBModal
                    article={selectedArticle}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    viewMode={viewMode}
                />
            )}
        </div>
    );
};
