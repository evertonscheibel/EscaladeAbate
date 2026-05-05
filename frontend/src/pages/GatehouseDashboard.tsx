import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PlusCircle,
    History,
    Truck,
    LogOut,
    Search,
    RefreshCw,
    AlertTriangle,
    Clock,
    User,
    ChevronRight,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { gatehouseService } from '../services/gatehouseService';
import { GatehouseAccess, DashboardKPIs } from '../types/gatehouse';
import './GatehouseDashboard.css';

export const GatehouseDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [inPatio, setInPatio] = useState<GatehouseAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'todos' | 'boiadeiro' | 'comum'>('todos');

    const loadData = async () => {
        try {
            setLoading(true);
            const [kpiRes, patioRes] = await Promise.all([
                gatehouseService.getDashboardKPIs(),
                gatehouseService.getInPatio({ search: searchTerm })
            ]);
            setKpis(kpiRes.data);
            setInPatio(patioRes.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [searchTerm]);

    const calculateTimeInPatio = (entryDate: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(entryDate).getTime()) / (1000 * 60));
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}min`;
    };

    const isAlerta = (entryDate: string) => {
        const diffHours = (new Date().getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60);
        return diffHours > 4;
    };

    const filteredInPatio = inPatio.filter(item => {
        if (activeTab === 'todos') return true;
        const tipoVeiculo = ((item.veiculo_id as any)?.tipo_veiculo || '').toLowerCase();
        if (activeTab === 'boiadeiro') return tipoVeiculo === 'boiadeiro' || tipoVeiculo === 'caminhao boiadeiro';
        if (activeTab === 'comum') return tipoVeiculo !== 'boiadeiro' && tipoVeiculo !== 'caminhao boiadeiro';
        return true;
    });

    return (
        <div className="page-container gatehouse-dashboard">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <div className="header-icon">
                            <Truck size={24} />
                        </div>
                        <h1>Controle de Portaria</h1>
                    </div>
                    <p>Gestão de fluxo de veículos e pessoal em tempo real</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/gatehouse/history')}>
                        <History size={18} />
                        Histórico
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/gatehouse/entry')}>
                        <PlusCircle size={18} />
                        Nova Entrada
                    </button>
                </div>
            </header>

            <div className="reports-kpi-grid">
                <div className="analysis-card kpi">
                    <div className="kpi-header">
                        <div className="kpi-icon blue"><Truck size={20} /></div>
                        <span className="kpi-label">Entradas Hoje</span>
                    </div>
                    <div className="kpi-value">{kpis?.entradas_hoje || 0}</div>
                </div>

                <div className="analysis-card kpi">
                    <div className="kpi-header">
                        <div className="kpi-icon green"><LogOut size={20} /></div>
                        <span className="kpi-label">Saídas Hoje</span>
                    </div>
                    <div className="kpi-value">{kpis?.saidas_hoje || 0}</div>
                </div>

                <div className="analysis-card kpi">
                    <div className="kpi-header">
                        <div className="kpi-icon purple"><Clock size={20} /></div>
                        <span className="kpi-label">Permanência Média</span>
                    </div>
                    <div className="kpi-value">{kpis?.permanencia_media_min || 0} min</div>
                </div>

                <div className="analysis-card kpi">
                    <div className="kpi-header">
                        <div className="kpi-icon orange"><AlertTriangle size={20} /></div>
                        <span className="kpi-label">No Pátio Agora</span>
                    </div>
                    <div className="kpi-value">{kpis?.no_patio_agora || 0}</div>
                </div>
            </div>

            <section className="content-card">
                <div className="filter-bar">
                    <div className="filter-group-main">
                        <div className="search-input-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por placa, empresa ou motorista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-actions">
                        <div className="tabs-container">
                            <button
                                className={`tab-item ${activeTab === 'todos' ? 'active' : ''}`}
                                onClick={() => setActiveTab('todos')}
                            >
                                Todos
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'comum' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comum')}
                            >
                                Veículos Comuns
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'boiadeiro' ? 'active' : ''}`}
                                onClick={() => setActiveTab('boiadeiro')}
                            >
                                Boiadeiros
                            </button>
                        </div>
                        <button className="btn-icon-only tertiary" onClick={() => loadData()} title="Atualizar">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="table-container ivory-table">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Veículo / Placa</th>
                                <th>Pessoa / Documento</th>
                                <th>Empresa / Vínculo</th>
                                <th>Destino / Guarita</th>
                                <th>Permanência</th>
                                <th>Tipo</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInPatio.map((access) => (
                                <tr key={access._id}>
                                    <td>
                                        <div className="plate-badge-premium">
                                            <span className="plate-text">{(access.veiculo_id as any).placa}</span>
                                            <span className="plate-type">{(access.veiculo_id as any).tipo_veiculo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar-mini">
                                                <User size={14} />
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">{(access.pessoa_id as any)?.nome || 'Visitante'}</span>
                                                <span className="user-sub">{(access.pessoa_id as any)?.documento || 'Sem doc.'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="empresa-text">{(access.empresa_id as any)?.nome_fantasia || 'Particular'}</span>
                                    </td>
                                    <td>
                                        <div className="destination-cell">
                                            <span className="dest-main">{access.destino || 'Pátio Central'}</span>
                                            <span className="dest-sub"><MapPin size={10} /> {(access.guarita_id as any)?.nome}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`time-badge ${isAlerta(access.dt_entrada) ? 'danger' : ''}`}>
                                            <Clock size={14} />
                                            {calculateTimeInPatio(access.dt_entrada)}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor: `${(access.tipo_acesso_id as any).cor}15`,
                                                color: (access.tipo_acesso_id as any).cor,
                                                borderColor: `${(access.tipo_acesso_id as any).cor}30`
                                            }}
                                        >
                                            {(access.tipo_acesso_id as any).nome}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            className="btn-primary btn-sm"
                                            onClick={() => navigate(`/gatehouse/exit/${access._id}`)}
                                        >
                                            Registrar Saída
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredInPatio.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="empty-state-cell">
                                        Nenhum registro ativo no pátio.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-pagination-info">
                    <span>Exibindo <strong>{filteredInPatio.length}</strong> registros ativos</span>
                    <span className="sync-status">Atualizado em tempo real</span>
                </div>
            </section>
        </div>
    );

};
