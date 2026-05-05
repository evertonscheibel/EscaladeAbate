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
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <div className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={22} />
                        </div>
                        <h1 style={{ marginLeft: '12px' }}>Cofre de Credenciais</h1>
                    </div>
                    <p>Gestão centralizada de senhas e acessos críticos criptografados</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus size={20} /> Nova Credencial
                    </button>
                </div>
            </header>

            <div className="filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                <div className="search-box" style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por título, host, usuário ou tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>

                <div className="filter-select-wrapper" style={{ minWidth: '180px' }}>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-control" style={{ width: '100%' }}>
                        <option value="">Todas Categorias</option>
                        <option value="servidor">Servidores</option>
                        <option value="rede">Rede / Wi-Fi</option>
                        <option value="banco_dados">Banco de Dados</option>
                        <option value="aplicacao">Aplicações</option>
                        <option value="cloud">Cloud / SaaS</option>
                        <option value="vpn">VPN / SSH</option>
                        <option value="api">APIs / Keys</option>
                    </select>
                </div>

                <div className="filter-select-wrapper" style={{ minWidth: '160px' }}>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-control" style={{ width: '100%' }}>
                        <option value="">Todos Status</option>
                        <option value="active">Ativas</option>
                        <option value="expired">Expiradas</option>
                        <option value="revoked">Revogadas</option>
                    </select>
                </div>
            </div>

            <div className="credentials-view-container">
                {Object.entries(groupedCredentials).length === 0 ? (
                    <div className="empty-state-container" style={{ textAlign: 'center', padding: '100px 0', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                        <Lock size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <h3 style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cofre Vazio</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nenhuma credencial localizada para os filtros atuais.</p>
                    </div>
                ) : (
                    Object.entries(groupedCredentials).map(([category, creds]) => (
                        <div key={category} className="category-block" style={{ marginBottom: '40px' }}>
                            <div className="category-header-premium" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 4px' }}>
                                <div className="category-badge" style={{ background: `${getCategoryColor(category)}15`, color: getCategoryColor(category), padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {getCategoryIcon(category)}
                                    {getCategoryLabel(category)}
                                    <span style={{ opacity: 0.5, marginLeft: '4px' }}>•</span>
                                    <span>{creds.length}</span>
                                </div>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }}></div>
                            </div>
                            <div className="credentials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                                {creds.map((cred: any) => (
                                    <div key={cred._id} className="premium-credential-card" style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: 'var(--shadow-soft)' }}>
                                        <div className="card-top" style={{ padding: '20px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                <div className="cred-icon-box" style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${getCategoryColor(cred.category)}10`, color: getCategoryColor(cred.category), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {getCategoryIcon(cred.category)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cred.title}</h4>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                        <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{cred.host || 'Interno / Local'}</span>
                                                    </div>
                                                </div>
                                                <div className="cred-status">
                                                    {getStatusBadge(cred)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-middle" style={{ padding: '20px', background: 'var(--bg-soft)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div className="cred-field-row">
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Identidade / Login</span>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text)' }}>{cred.username || '---'}</span>
                                                    {cred.username && (
                                                        <button
                                                            className="btn-icon sm"
                                                            onClick={() => handleCopyUsername(cred.username, cred._id)}
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                                        >
                                                            {copiedId === `user-${cred._id}` ? <CheckCircle size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="cred-field-row">
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Chave / Password</span>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text)', letterSpacing: visiblePasswords.has(cred._id) ? '0' : '2px' }}>
                                                        {loadingPassword === cred._id ? (
                                                            '...'
                                                        ) : visiblePasswords.has(cred._id) && passwordCache[cred._id] ? (
                                                            passwordCache[cred._id]
                                                        ) : (
                                                            '••••••••'
                                                        )}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="btn-icon sm"
                                                            onClick={() => togglePasswordVisibility(cred._id)}
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                                            disabled={loadingPassword === cred._id}
                                                        >
                                                            {visiblePasswords.has(cred._id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                        <button
                                                            className="btn-icon sm"
                                                            onClick={() => handleCopyPassword(cred._id)}
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                                        >
                                                            {copiedId === cred._id ? <CheckCircle size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-bottom" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                    <History size={12} />
                                                    {cred.lastAccessed ? new Date(cred.lastAccessed).toLocaleDateString('pt-BR') : 'Sem uso'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                    <Eye size={12} />
                                                    {cred.accessCount || 0}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn-icon sm" onClick={() => handleViewAccessLog(cred)} title="Logs de Acesso">
                                                    <History size={14} />
                                                </button>
                                                <button className="btn-icon sm" onClick={() => handleEdit(cred)} title="Editar">
                                                    <Edit size={14} />
                                                </button>
                                                <button className="btn-icon sm" onClick={() => handleDelete(cred._id)} title="Excluir" style={{ color: 'var(--error)' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
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
