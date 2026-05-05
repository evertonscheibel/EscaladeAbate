import React, { useEffect, useState } from 'react';
import { credentialService } from '../services/credentialService';
import { CredentialModal } from '../components/CredentialModal';
import {
    Key,
    Lock,
    Plus,
    Search,
    Eye,
    EyeOff,
    Copy,
    Edit,
    Trash2,
    Server,
    Wifi,
    Database,
    Globe,
    Mail,
    Shield,
    Clock,
    AlertTriangle,
    CheckCircle,
    Filter,
    History,
    X
} from 'lucide-react';
import './Credentials.css';

export const Credentials: React.FC = () => {
    const [credentials, setCredentials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState<any | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showAccessLog, setShowAccessLog] = useState(false);
    const [accessLogData, setAccessLogData] = useState<any>(null);
    const [loadingPassword, setLoadingPassword] = useState<string | null>(null);
    const [passwordCache, setPasswordCache] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = async () => {
        try {
            const response = await credentialService.getAll();
            setCredentials(response.data);
        } catch (error) {
            console.error('Erro ao carregar credenciais:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedCredential(null);
        setShowModal(true);
    };

    const handleEdit = async (credential: any) => {
        try {
            // Buscar credencial completa com senha
            const response = await credentialService.getById(credential._id);
            setSelectedCredential(response.data);
            setShowModal(true);
        } catch (error) {
            console.error('Erro ao buscar credencial:', error);
            alert('Erro ao carregar credencial');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta credencial? Esta ação não pode ser desfeita.')) return;

        try {
            await credentialService.delete(id);
            loadCredentials();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir credencial');
        }
    };

    const handleSave = () => {
        setShowModal(false);
        loadCredentials();
    };

    const togglePasswordVisibility = async (id: string) => {
        if (visiblePasswords.has(id)) {
            setVisiblePasswords(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } else {
            // Buscar senha se não estiver em cache
            if (!passwordCache[id]) {
                setLoadingPassword(id);
                try {
                    const response = await credentialService.copyPassword(id);
                    setPasswordCache(prev => ({ ...prev, [id]: response.data.password }));
                } catch (error) {
                    console.error('Erro ao buscar senha:', error);
                    alert('Erro ao buscar senha');
                    setLoadingPassword(null);
                    return;
                }
                setLoadingPassword(null);
            }
            setVisiblePasswords(prev => new Set(prev).add(id));
        }
    };

    const handleCopyPassword = async (id: string) => {
        try {
            let password = passwordCache[id];

            if (!password) {
                const response = await credentialService.copyPassword(id);
                password = response.data.password;
                setPasswordCache(prev => ({ ...prev, [id]: password }));
            }

            await navigator.clipboard.writeText(password);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Erro ao copiar senha:', error);
            alert('Erro ao copiar senha');
        }
    };

    const handleCopyUsername = async (username: string, id: string) => {
        try {
            await navigator.clipboard.writeText(username);
            setCopiedId(`user-${id}`);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Erro ao copiar usuário:', error);
        }
    };

    const handleViewAccessLog = async (credential: any) => {
        try {
            const response = await credentialService.getAccessLog(credential._id);
            setAccessLogData(response.data);
            setShowAccessLog(true);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            alert('Erro ao buscar histórico de acesso');
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, React.ReactNode> = {
            'servidor': <Server size={18} />,
            'rede': <Wifi size={18} />,
            'banco_dados': <Database size={18} />,
            'aplicacao': <Globe size={18} />,
            'cloud': <Globe size={18} />,
            'email': <Mail size={18} />,
            'vpn': <Shield size={18} />,
            'api': <Key size={18} />,
            'certificado': <Lock size={18} />,
            'wifi': <Wifi size={18} />,
            'outro': <Key size={18} />
        };
        return icons[category] || <Key size={18} />;
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'servidor': 'Servidor',
            'rede': 'Rede',
            'banco_dados': 'Banco de Dados',
            'aplicacao': 'Aplicação',
            'cloud': 'Cloud',
            'email': 'E-mail',
            'vpn': 'VPN',
            'api': 'API',
            'certificado': 'Certificado',
            'wifi': 'WiFi',
            'outro': 'Outro'
        };
        return labels[category] || category;
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'servidor': '#3b82f6',
            'rede': '#8b5cf6',
            'banco_dados': '#f59e0b',
            'aplicacao': '#10b981',
            'cloud': '#06b6d4',
            'email': '#ec4899',
            'vpn': '#6366f1',
            'api': '#84cc16',
            'certificado': '#ef4444',
            'wifi': '#8b5cf6',
            'outro': '#64748b'
        };
        return colors[category] || '#64748b';
    };

    const getStatusBadge = (credential: any) => {
        if (credential.status === 'revoked') {
            return <span className="status-badge revoked"><X size={12} /> Revogada</span>;
        }
        if (credential.status === 'expired' || credential.isExpired) {
            return <span className="status-badge expired"><AlertTriangle size={12} /> Expirada</span>;
        }
        if (credential.needsRotation) {
            return <span className="status-badge warning"><Clock size={12} /> Rotação Pendente</span>;
        }
        return <span className="status-badge active"><CheckCircle size={12} /> Ativa</span>;
    };

    const filteredCredentials = credentials.filter(cred => {
        const matchesSearch =
            cred.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.host?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory ? cred.category === filterCategory : true;
        const matchesStatus = filterStatus ? cred.status === filterStatus : true;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Agrupar por categoria
    const groupedCredentials: Record<string, any[]> = filteredCredentials.reduce((acc: Record<string, any[]>, cred) => {
        const cat = cred.category || 'outro';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(cred);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Carregando cofre de credenciais...</p>
            </div>
        );
    }

    return (
        <div className="credentials-page">
            <div className="page-header">
                <div>
                    <h1><Lock size={28} /> Cofre de Credenciais</h1>
                    <p>Armazenamento seguro de senhas e acessos</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus size={18} /> Nova Credencial
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título, descrição, host ou usuário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">Todas as Categorias</option>
                    <option value="servidor">Servidor</option>
                    <option value="rede">Rede</option>
                    <option value="banco_dados">Banco de Dados</option>
                    <option value="aplicacao">Aplicação</option>
                    <option value="cloud">Cloud</option>
                    <option value="email">E-mail</option>
                    <option value="vpn">VPN</option>
                    <option value="api">API</option>
                    <option value="wifi">WiFi</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Todos os Status</option>
                    <option value="active">Ativas</option>
                    <option value="expired">Expiradas</option>
                    <option value="revoked">Revogadas</option>
                </select>
            </div>

            {/* Lista de Credenciais */}
            <div className="credentials-container">
                {Object.entries(groupedCredentials).map(([category, creds]) => (
                    <div key={category} className="category-section">
                        <div className="category-header" style={{ borderLeftColor: getCategoryColor(category) }}>
                            {getCategoryIcon(category)}
                            <h2>{getCategoryLabel(category)}</h2>
                            <span className="count">{creds.length}</span>
                        </div>
                        <div className="credentials-grid">
                            {creds.map((cred: any) => (
                                <div key={cred._id} className="credential-card">
                                    <div className="card-header">
                                        <div className="card-icon" style={{ backgroundColor: getCategoryColor(cred.category) }}>
                                            {getCategoryIcon(cred.category)}
                                        </div>
                                        <div className="card-title">
                                            <h3>{cred.title}</h3>
                                            {cred.description && <p>{cred.description}</p>}
                                        </div>
                                        {getStatusBadge(cred)}
                                    </div>

                                    <div className="card-body">
                                        {cred.host && (
                                            <div className="field">
                                                <label>Host / URL</label>
                                                <span className="value mono">{cred.host}{cred.port ? `:${cred.port}` : ''}</span>
                                            </div>
                                        )}

                                        {cred.username && (
                                            <div className="field">
                                                <label>Usuário</label>
                                                <div className="value-with-action">
                                                    <span className="value mono">{cred.username}</span>
                                                    <button
                                                        className="btn-copy"
                                                        onClick={() => handleCopyUsername(cred.username, cred._id)}
                                                        title="Copiar usuário"
                                                    >
                                                        {copiedId === `user-${cred._id}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="field">
                                            <label>Senha</label>
                                            <div className="password-field">
                                                <span className="value mono">
                                                    {loadingPassword === cred._id ? (
                                                        'Carregando...'
                                                    ) : visiblePasswords.has(cred._id) && passwordCache[cred._id] ? (
                                                        passwordCache[cred._id]
                                                    ) : (
                                                        '••••••••••••'
                                                    )}
                                                </span>
                                                <div className="password-actions">
                                                    <button
                                                        className="btn-toggle"
                                                        onClick={() => togglePasswordVisibility(cred._id)}
                                                        title={visiblePasswords.has(cred._id) ? 'Ocultar senha' : 'Mostrar senha'}
                                                        disabled={loadingPassword === cred._id}
                                                    >
                                                        {visiblePasswords.has(cred._id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        className="btn-copy"
                                                        onClick={() => handleCopyPassword(cred._id)}
                                                        title="Copiar senha"
                                                    >
                                                        {copiedId === cred._id ? <CheckCircle size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {cred.tags && cred.tags.length > 0 && (
                                            <div className="tags">
                                                {cred.tags.map((tag: string, idx: number) => (
                                                    <span key={idx} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer">
                                        <div className="meta">
                                            {cred.lastAccessed && (
                                                <span title="Último acesso">
                                                    <Clock size={12} />
                                                    {new Date(cred.lastAccessed).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                            {cred.accessCount > 0 && (
                                                <span title="Acessos">
                                                    <Eye size={12} />
                                                    {cred.accessCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="actions">
                                            <button
                                                className="btn-action"
                                                onClick={() => handleViewAccessLog(cred)}
                                                title="Histórico de Acesso"
                                            >
                                                <History size={16} />
                                            </button>
                                            <button
                                                className="btn-action"
                                                onClick={() => handleEdit(cred)}
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-action danger"
                                                onClick={() => handleDelete(cred._id)}
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredCredentials.length === 0 && (
                    <div className="empty-state">
                        <Lock size={48} />
                        <h3>Nenhuma credencial encontrada</h3>
                        <p>Clique em "Nova Credencial" para adicionar uma senha ao cofre.</p>
                    </div>
                )}
            </div>

            {/* Modal de Criação/Edição */}
            {showModal && (
                <CredentialModal
                    credential={selectedCredential}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {/* Modal de Histórico de Acesso */}
            {showAccessLog && accessLogData && (
                <div className="modal-overlay" onClick={() => setShowAccessLog(false)}>
                    <div className="modal-content access-log-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><History size={20} /> Histórico de Acesso</h2>
                            <button className="close-btn" onClick={() => setShowAccessLog(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <h3>{accessLogData.title}</h3>
                            {accessLogData.accessLog && accessLogData.accessLog.length > 0 ? (
                                <div className="access-log-list">
                                    {accessLogData.accessLog.map((log: any, idx: number) => (
                                        <div key={idx} className="log-item">
                                            <div className="log-icon">
                                                {log.action === 'view' && <Eye size={16} />}
                                                {log.action === 'copy' && <Copy size={16} />}
                                                {log.action === 'edit' && <Edit size={16} />}
                                                {log.action === 'create' && <Plus size={16} />}
                                            </div>
                                            <div className="log-content">
                                                <span className="log-action">
                                                    {log.action === 'view' && 'Visualizou'}
                                                    {log.action === 'copy' && 'Copiou senha'}
                                                    {log.action === 'edit' && 'Editou'}
                                                    {log.action === 'create' && 'Criou'}
                                                </span>
                                                <span className="log-user">{log.user?.name || 'Usuário'}</span>
                                            </div>
                                            <div className="log-time">
                                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-logs">Nenhum acesso registrado</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Credentials;
