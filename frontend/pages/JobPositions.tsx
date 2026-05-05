import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    jobPositionService,
    JobPosition
} from '../services';
import JobPositionModal from '../components/JobPositionModal';
import {
    Search,
    Filter,
    Briefcase,
    Building2,
    Users,
    TrendingUp,
    MoreHorizontal,
    Eye,
    ChevronLeft,
    ChevronRight,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import './JobPositions.css';

const JobPositions: React.FC = () => {
    const [positions, setPositions] = useState<JobPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterSector, setFilterSector] = useState<string>('');
    const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadPositions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await jobPositionService.getAll();
            setPositions(response.data);
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPositions();
    }, [loadPositions]);

    const sectors = useMemo(() => {
        const s = new Set<string>();
        positions.forEach(p => s.add(p.setor));
        return Array.from(s).sort();
    }, [positions]);

    const filteredPositions = useMemo(() => {
        return positions.filter(p => {
            const matchesSearch = p.titulo_vaga.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.id_externo.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus ? p.status === filterStatus : true;
            const matchesSector = filterSector ? p.setor === filterSector : true;
            return matchesSearch && matchesStatus && matchesSector;
        });
    }, [positions, searchTerm, filterStatus, filterSector]);

    const stats = useMemo(() => {
        return {
            total: positions.length,
            open: positions.filter(p => p.status === 'EM_ABERTO').length,
            closed: positions.filter(p => p.status === 'FECHADA').length,
            sectorsCount: sectors.length
        };
    }, [positions, sectors]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'EM_ABERTO':
                return <span className="status-badge status-open">Aberto</span>;
            case 'FECHADA':
                return <span className="status-badge status-closed">Fechado</span>;
            case 'CANCELADA':
                return <span className="status-badge status-canceled">Cancelado</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const formatCurrency = (value?: number) => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="job-positions-page">
            <header className="page-header">
                <div>
                    <h1>Cargos e Vagas (ATS)</h1>
                    <p>Gerencie as oportunidades disponíveis no sistema</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={loadPositions}>
                        Atualizar Lista
                    </button>
                    <button className="btn-primary">
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </header>

            <section className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon icon-blue"><Briefcase size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total de Vagas</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-green"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Vagas em Aberto</span>
                        <span className="stat-value">{stats.open}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-yellow"><Building2 size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Setores Ativos</span>
                        <span className="stat-value">{stats.sectorsCount}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-purple"><Users size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Vagas Fechadas</span>
                        <span className="stat-value">{stats.closed}</span>
                    </div>
                </div>
            </section>

            <section className="filters-section">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por título ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <div className="filter-item">
                        <Filter size={18} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">Todos os Status</option>
                            <option value="EM_ABERTO">Aberto</option>
                            <option value="FECHADA">Fechado</option>
                            <option value="CANCELADA">Cancelado</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <Building2 size={18} />
                        <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)}>
                            <option value="">Todos os Setores</option>
                            {sectors.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            <section className="positions-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Carregando vagas...</span>
                    </div>
                ) : filteredPositions.length > 0 ? (
                    <div className="table-responsive">
                        <table className="positions-table">
                            <thead>
                                <tr>
                                    <th>Cargo / ID</th>
                                    <th>Setor</th>
                                    <th>Salário Base</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPositions.map(pos => (
                                    <tr key={pos._id}>
                                        <td>
                                            <div className="position-title-cell">
                                                <span className="position-title">{pos.titulo_vaga}</span>
                                                <span className="position-id">{pos.id_externo}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="sector-badge">{pos.setor}</span>
                                        </td>
                                        <td>
                                            <div className="salary-cell">
                                                {formatCurrency(pos.salario?.salario_base)}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(pos.status)}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button
                                                    className="btn-action"
                                                    title="Ver Detalhes"
                                                    onClick={() => {
                                                        setSelectedPositionId(pos._id);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Briefcase size={64} opacity={0.3} />
                        <h3>Nenhuma vaga encontrada</h3>
                        <p>Tente ajustar os filtros ou busca.</p>
                    </div>
                )}
            </section>

            {isModalOpen && selectedPositionId && (
                <JobPositionModal
                    positionId={selectedPositionId}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedPositionId(null);
                    }}
                />
            )}
        </div>
    );
};

export default JobPositions;
