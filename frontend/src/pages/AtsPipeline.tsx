import React, { useState, useEffect, useCallback } from 'react';
import {
    candidateService,
    Candidate,
    CandidateFilters
} from '../services';
import {
    Users, UserCheck, Clock, Star, Search, Filter, X,
    ChevronRight, ArrowLeft, Eye, TrendingUp
} from 'lucide-react';
import CandidateModal from '../components/CandidateModal';
import './AtsPipeline.css';

const PIPELINE_COLUMNS = [
    { id: 'novo', label: 'Novo', color: '#3b82f6', icon: '📥' },
    { id: 'em_analise', label: 'Em Análise', color: '#f59e0b', icon: '🔍' },
    { id: 'pre_selecionado', label: 'Pré-selecionado', color: '#8b5cf6', icon: '⭐' },
    { id: 'aguardando_entrevista', label: 'Ag. Entrevista', color: '#ec4899', icon: '📅' },
    { id: 'entrevistado', label: 'Entrevistado', color: '#6366f1', icon: '💬' },
    { id: 'aprovado', label: 'Aprovado', color: '#10b981', icon: '✅' },
    { id: 'contratado', label: 'Contratado', color: '#059669', icon: '🎉' },
    { id: 'reprovado', label: 'Reprovado', color: '#ef4444', icon: '❌' }
];

const AtsPipeline: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const loadCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await candidateService.getAll({ limit: 200 });
            setCandidates(resp.data.data || []);
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCandidates();
    }, [loadCandidates]);

    const handleMoveStatus = async (candidateId: string, newStatus: string) => {
        try {
            await candidateService.updateStatus(candidateId, newStatus);
            loadCandidates();
        } catch (error) {
            alert('Erro ao mover candidato');
        }
    };

    const filteredCandidates = searchTerm
        ? candidates.filter(c =>
            c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.desiredPosition?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : candidates;

    const getColumnCandidates = (statusId: string) =>
        filteredCandidates.filter(c => c.status === statusId);

    return (
        <div className="ats-pipeline-page">
            <header className="page-header">
                <div className="header-info">
                    <div>
                        <h1 className="page-title">Pipeline Seletivo</h1>
                        <p className="page-subtitle">Visão Kanban do processo de recrutamento</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="pipeline-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar candidato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="pipeline-stats">
                        <span className="stat-pill"><Users size={14} /> {candidates.length} total</span>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Carregando pipeline...</div>
            ) : (
                <div className="pipeline-board">
                    {PIPELINE_COLUMNS.map(col => {
                        const items = getColumnCandidates(col.id);
                        return (
                            <div key={col.id} className="pipeline-column">
                                <div className="column-header" style={{ borderTopColor: col.color }}>
                                    <span className="column-icon">{col.icon}</span>
                                    <span className="column-title">{col.label}</span>
                                    <span className="column-count" style={{ background: col.color + '20', color: col.color }}>
                                        {items.length}
                                    </span>
                                </div>
                                <div className="column-body">
                                    {items.length === 0 && (
                                        <div className="column-empty">Nenhum candidato</div>
                                    )}
                                    {items.map(candidate => (
                                        <div key={candidate._id} className="pipeline-card">
                                            <div className="card-top">
                                                <div className="card-avatar" style={{ background: col.color + '20', color: col.color }}>
                                                    {candidate.fullName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="card-info">
                                                    <span className="card-name">{candidate.fullName || 'Sem Nome'}</span>
                                                    <span className="card-position">{candidate.desiredPosition}</span>
                                                </div>
                                            </div>

                                            {candidate.priority === 'urgente' && (
                                                <div className="card-priority urgent">🔥 Urgente</div>
                                            )}
                                            {candidate.priority === 'alta' && (
                                                <div className="card-priority high">⚡ Alta Prioridade</div>
                                            )}

                                            <div className="card-meta">
                                                {candidate.interviews?.length > 0 && (
                                                    <span className="meta-tag">💬 {candidate.interviews.length} entrev.</span>
                                                )}
                                                {candidate.notes?.length > 0 && (
                                                    <span className="meta-tag">📝 {candidate.notes.length} notas</span>
                                                )}
                                            </div>

                                            <div className="card-actions">
                                                <button className="card-btn view" onClick={() => {
                                                    setSelectedId(candidate._id);
                                                    setShowModal(true);
                                                }}>
                                                    <Eye size={14} /> Ver
                                                </button>
                                                {/* Move buttons */}
                                                <div className="move-btns">
                                                    {col.id !== 'contratado' && col.id !== 'reprovado' && (
                                                        <select
                                                            className="move-select"
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value) handleMoveStatus(candidate._id, e.target.value);
                                                            }}
                                                        >
                                                            <option value="">Mover →</option>
                                                            {PIPELINE_COLUMNS.filter(c => c.id !== col.id).map(c => (
                                                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <CandidateModal
                    candidateId={selectedId || undefined}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedId(null);
                        loadCandidates();
                    }}
                />
            )}
        </div>
    );
};

export default AtsPipeline;
