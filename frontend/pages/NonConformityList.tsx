import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Clock,
    CheckCircle2,
    Filter,
    Search,
    ChevronRight,
    User,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { pacService } from '../services/pacService';
import { NonConformity } from '../types/pac';
import './NonConformityList.css';

export const NonConformityList: React.FC = () => {
    const [ncs, setNcs] = useState<NonConformity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Todas');

    useEffect(() => {
        loadNCs();
    }, []);

    const loadNCs = async () => {
        try {
            const response = await pacService.getNonConformities();
            setNcs(response.data || []);
        } catch (err) {
            console.error('Erro ao carregar NCs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Aberta': return 'status-aberta';
            case 'Em andamento': return 'status-andamento';
            case 'Aguardando verificação': return 'status-verificacao';
            case 'Fechada': return 'status-fechada';
            case 'Vencida': return 'status-vencida';
            default: return '';
        }
    };

    const filteredNcs = filterStatus === 'Todas'
        ? ncs
        : ncs.filter(nc => nc.status === filterStatus);

    if (loading) return <div className="loading">Carregando NCs...</div>;

    return (
        <div className="nc-page">
            <header className="nc-header">
                <div>
                    <h1>Não Conformidades (CAPA)</h1>
                    <p>Gestão de ações corretivas e preventivas</p>
                </div>
                <div className="nc-filters">
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar NC..." />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="status-select"
                    >
                        <option value="Todas">Todas</option>
                        <option value="Aberta">Abertas</option>
                        <option value="Em andamento">Em Andamento</option>
                        <option value="Aguardando verificação">Aguardando Verificação</option>
                        <option value="Fechada">Fechadas</option>
                        <option value="Vencida">Vencidas</option>
                    </select>
                </div>
            </header>

            <div className="nc-list">
                {filteredNcs.length === 0 ? (
                    <div className="no-data">Nenhuma não conformidade encontrada.</div>
                ) : (
                    filteredNcs.map(nc => (
                        <div key={nc._id} className={`nc-card ${nc.criticidade.toLowerCase()}`}>
                            <div className="nc-card-header">
                                <span className="nc-code">{nc.codigo_nc}</span>
                                <span className={`nc-status-badge ${getStatusClass(nc.status)}`}>
                                    {nc.status}
                                </span>
                            </div>

                            <h3 className="nc-description">{nc.descricao}</h3>

                            <div className="nc-meta-grid">
                                <div className="meta-item">
                                    <AlertTriangle size={14} />
                                    <span>{nc.criticidade}</span>
                                </div>
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>Prazo: {new Date(nc.prazo).toLocaleDateString()}</span>
                                </div>
                                <div className="meta-item">
                                    <User size={14} />
                                    <span>{nc.responsavel_acao?.name || 'Não atribuído'}</span>
                                </div>
                                <div className="meta-item">
                                    <Calendar size={14} />
                                    <span>Abertura: {new Date(nc.data_abertura).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="nc-card-info">
                                <span className="nc-origin">Origem: {nc.programa?.codigo || '---'} - {nc.area?.nome || 'Área não definida'}</span>
                            </div>

                            <div className="nc-actions">
                                <button className="btn-details">
                                    Tratar NC <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
