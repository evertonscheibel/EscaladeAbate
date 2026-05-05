import React, { useState, useEffect, useCallback } from 'react';
import {
    candidateService,
    Candidate,
    CandidateFilters
} from '../services';
import {
    Search,
    Filter,
    Users,
    UserCheck,
    Clock,
    TrendingUp,
    MoreHorizontal,
    Eye,
    Trash2,
    Calendar,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Download,
    Star
} from 'lucide-react';
import CandidateModal from '../components/CandidateModal.tsx';
import './Candidates.css';

const STATUS_LABELS: Record<string, string> = {
    'novo': 'Novo',
    'em_analise': 'Em Análise',
    'pre_selecionado': 'Pré-selecionado',
    'aguardando_entrevista': 'Aguardando Entrevista',
    'entrevistado': 'Entrevistado',
    'aprovado': 'Aprovado',
    'reprovado': 'Reprovado',
    'desistente': 'Desistente',
    'contratado': 'Contratado'
};

const Candidates: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<CandidateFilters>({
        page: 1,
        limit: 10,
        status: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1
    });
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const loadCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const [respList, respStats] = await Promise.all([
                candidateService.getAll(filters),
                candidateService.getDashboard()
            ]);
            setCandidates(respList.data.data);
            setPagination(respList.data.pagination);
            setDashboardStats(respStats.data);
        } catch (error) {
            console.error('Erro ao carregar candidatos:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadCandidates();
    }, [loadCandidates]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev: CandidateFilters) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev: CandidateFilters) => ({ ...prev, page: newPage }));
    };

    const handleViewCandidate = (id: string) => {
        setSelectedCandidateId(id);
        setShowModal(true);
    };

    const handleDeleteCandidate = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este candidato? Esta ação não pode ser desfeita.')) {
            try {
                await candidateService.delete(id);
                loadCandidates();
            } catch (error) {
                alert('Erro ao excluir candidato');
            }
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'novo': return 'status-new';
            case 'em_analise': return 'status-process';
            case 'pre_selecionado': return 'status-selected';
            case 'aprovado':
            case 'contratado': return 'status-approved';
            case 'reprovado':
            case 'desistente': return 'status-rejected';
            default: return '';
        }
    };

    return (
        <div className="candidates-page">
            <header className="page-header">
                <div>
                    <h1>Gestão de Talentos (ATS)</h1>
                    <p>Gerencie o processo seletivo e novos candidatos</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => window.open('/trabalhe-conosco', '_blank')}>
                        Ver Formulário Público
                    </button>
                    <button className="btn-primary">
                        <Download size={18} /> Exportar Relatório
                    </button>
                </div>
            </header>

            {dashboardStats && (
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon icon-blue"><Users size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-label">Total de Candidatos</span>
                            <span className="stat-value">{dashboardStats.total}</span>
                        </div>
                        <div className="stat-trend positive">
                            <TrendingUp size={14} /> +{dashboardStats.thisMonth} este mês
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon icon-yellow"><Clock size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-label">Em Análise/Novo</span>
                            <span className="stat-value">{(dashboardStats.stats?.novos || 0) + (dashboardStats.stats?.emAnalise || 0)}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon icon-purple"><Star size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-label">Aguardando Entrevista</span>
                            <span className="stat-value">{dashboardStats.stats?.aguardandoEntrevista || 0}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon icon-green"><UserCheck size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-label">Aprovados/Contratados</span>
                            <span className="stat-value">{(dashboardStats.stats?.aprovados || 0) + (dashboardStats.stats?.contratados || 0)}</span>
                        </div>
                    </div>
                </section>
            )}

            <section className="filters-section">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        name="search"
                        placeholder="Buscar por nome, email, CPF ou protocolo..."
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter-group">
                    <div className="filter-item">
                        <Filter size={18} />
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">Todos os Status</option>
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <Briefcase size={18} />
                        <input
                            type="text"
                            name="desiredPosition"
                            placeholder="Filtrar por cargo..."
                            value={filters.desiredPosition}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </section>

            <section className="candidates-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Carregando candidatos...</span>
                    </div>
                ) : candidates.length > 0 ? (
                    <>
                        <div className="table-responsive">
                            <table className="candidates-table">
                                <thead>
                                    <tr>
                                        <th>Candidato</th>
                                        <th>Vaga Desejada</th>
                                        <th>Protocolo</th>
                                        <th>Data Cadastro</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.map(candidate => (
                                        <tr key={candidate._id}>
                                            <td>
                                                <div className="candidate-info-cell">
                                                    <div className="candidate-avatar">
                                                        {candidate.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="candidate-name">{candidate.fullName}</span>
                                                        <span className="candidate-email">{candidate.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="vaga-info">
                                                    <span>{candidate.desiredPosition}</span>
                                                    <small>{candidate.education.replace('_', ' ')}</small>
                                                </div>
                                            </td>
                                            <td><code className="protocol-badge">{candidate.protocol}</code></td>
                                            <td>
                                                <div className="date-cell">
                                                    <Calendar size={14} />
                                                    {new Date(candidate.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(candidate.status)}`}>
                                                    {STATUS_LABELS[candidate.status] || candidate.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="btn-action"
                                                        title="Ver Detalhes"
                                                        onClick={() => handleViewCandidate(candidate._id)}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-action btn-delete"
                                                        title="Excluir"
                                                        onClick={() => handleDeleteCandidate(candidate._id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination">
                            <button
                                disabled={filters.page === 1}
                                onClick={() => handlePageChange(filters.page! - 1)}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="page-info">
                                Página <strong>{filters.page}</strong> de <strong>{pagination.pages}</strong>
                            </span>
                            <button
                                disabled={filters.page === pagination.pages}
                                onClick={() => handlePageChange(filters.page! + 1)}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <Users size={64} opacity={0.3} />
                        <h3>Nenhum candidato encontrado</h3>
                        <p>Tente ajustar seus filtros ou busca.</p>
                    </div>
                )}
            </section>

            {showModal && selectedCandidateId && (
                <CandidateModal
                    candidateId={selectedCandidateId}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedCandidateId(null);
                        loadCandidates();
                    }}
                />
            )}
        </div>
    );
};

export default Candidates;
