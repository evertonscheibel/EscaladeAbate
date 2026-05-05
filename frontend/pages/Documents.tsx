import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { certificateService } from '../services';
import { Plus, Search, AlertTriangle, Edit, Trash2, FileText, Briefcase, Shield, Calendar, DollarSign } from 'lucide-react';
import { DocumentModal } from '../components/DocumentModal';
import '../pages/Tickets.css';

export const Documents: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
    const [filter, setFilter] = useState('todos');

    const location = useLocation();

    // Ler filtro da URL na montagem
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setFilter(tab);
        }
    }, [location]);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const response = await certificateService.getAll();
            setDocuments(response.data);
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDocument = () => {
        setSelectedDocument(null);
        setShowModal(true);
    };

    const handleEditDocument = (doc: any) => {
        setSelectedDocument(doc);
        setShowModal(true);
    };

    const handleDeleteDocument = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este documento?')) return;

        try {
            await certificateService.delete(id);
            loadDocuments();
        } catch (error) {
            console.error('Erro ao excluir documento:', error);
            alert('Erro ao excluir documento');
        }
    };

    const handleSave = () => {
        loadDocuments();
    };

    const getDaysUntilExpiration = (expirationDate: string) => {
        const diff = new Date(expirationDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'contrato': return <Briefcase size={16} className="type-icon-contract" />;
            case 'garantia': return <Shield size={16} className="type-icon-warranty" />;
            case 'boleto': return <DollarSign size={16} className="type-icon-boleto" style={{ color: '#10b981' }} />;
            default: return <FileText size={16} className="type-icon-default" />;
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'contrato': 'Contrato',
            'garantia': 'Garantia',
            'boleto': 'Boleto',
            'licenca_software': 'Licença',
            'equipamentos_industriais': 'Certificado',
            'dominio': 'Domínio',
            'outro': 'Outro'
        };
        return labels[type] || type;
    };

    const filteredDocuments = filter === 'todos'
        ? documents
        : documents.filter(doc => doc.type === filter || (filter === 'outros' && !['contrato', 'garantia'].includes(doc.type)));

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando central de documentos...</p></div>;
    }

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Gestão de Documentos</h1>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="stats-badge"><FileText size={14} /> {documents.length} no total</span>
                        <span className="stats-badge"><Briefcase size={14} /> {documents.filter(d => d.type === 'contrato').length} contratos</span>
                        <span className="stats-badge"><DollarSign size={14} /> {documents.filter(d => d.type === 'boleto').length} boletos</span>
                        <span className="stats-badge"><Shield size={14} /> {documents.filter(d => d.type === 'garantia').length} garantias</span>
                    </p>
                </div>
                <button className="btn-primary" onClick={handleCreateDocument}>
                    <Plus size={20} />
                    Novo Documento
                </button>
            </div>

            <div className="filter-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    className={`filter-tab ${filter === 'todos' ? 'active' : ''}`}
                    onClick={() => setFilter('todos')}
                >Todos</button>
                <button
                    className={`filter-tab ${filter === 'contrato' ? 'active' : ''}`}
                    onClick={() => setFilter('contrato')}
                >Contratos</button>
                <button
                    className={`filter-tab ${filter === 'garantia' ? 'active' : ''}`}
                    onClick={() => setFilter('garantia')}
                >Garantias</button>
                <button
                    className={`filter-tab ${filter === 'boleto' ? 'active' : ''}`}
                    onClick={() => setFilter('boleto')}
                >Boletos</button>
                <button
                    className={`filter-tab ${filter === 'outros' ? 'active' : ''}`}
                    onClick={() => setFilter('outros')}
                >Certificados & Licenças</button>
            </div>

            <div className="tickets-table-container">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Tipo</th>
                            <th>Fornecedor / Ativo</th>
                            <th>Vencimento</th>
                            <th>Valor / Ciclo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocuments.map((doc) => {
                            const daysLeft = getDaysUntilExpiration(doc.expirationDate);
                            const isExpiring = daysLeft <= 30 && daysLeft > 0;
                            const isExpired = daysLeft <= 0;

                            return (
                                <tr key={doc._id} className={isExpired ? 'row-expired' : isExpiring ? 'row-expiring' : ''}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {getTypeIcon(doc.type)}
                                            <div>
                                                <strong>{doc.name}</strong>
                                                {doc.documentNumber && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>#{doc.documentNumber}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`category-badge type-${doc.type}`}>{getTypeLabel(doc.type)}</span></td>
                                    <td>
                                        {doc.type === 'garantia' && doc.linkedAsset ? (
                                            <div title={doc.linkedAsset.description}>
                                                <strong>Ativo: {doc.linkedAsset.assetId}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.linkedAsset.brand} {doc.linkedAsset.model}</div>
                                            </div>
                                        ) : (
                                            doc.provider || 'N/A'
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{new Date(doc.expirationDate).toLocaleDateString('pt-BR')}</span>
                                            <strong style={{
                                                fontSize: '0.75rem',
                                                color: isExpired ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#10b981'
                                            }}>
                                                {isExpired ? 'EXPIRADO' : `${daysLeft} dias`}
                                            </strong>
                                        </div>
                                    </td>
                                    <td>
                                        {doc.type === 'contrato' ? (
                                            <div>
                                                <strong>R$ {doc.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{doc.billingCycle}</div>
                                            </div>
                                        ) : doc.type === 'boleto' ? (
                                            <div>
                                                <strong>R$ {doc.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                                {doc.deliverByDate && <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Entrega: {new Date(doc.deliverByDate).toLocaleDateString()}</div>}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${doc.status}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleEditDocument(doc)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn-icon danger" onClick={() => handleDeleteDocument(doc._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <DocumentModal
                    document={selectedDocument}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
