import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    Calendar,
    Clock,
    Truck,
    User,
    Building2,
    Eye,
    MapPin,
    History
} from 'lucide-react';
import { gatehouseService } from '../services/gatehouseService';
import { GatehouseAccess, AccessType } from '../types/gatehouse';
import './GatehouseHistory.css';

export const GatehouseHistory: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<GatehouseAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [types, setTypes] = useState<AccessType[]>([]);

    const [filters, setFilters] = useState({
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        placa: '',
        empresa_id: '',
        tipo_acesso_id: '',
        status: ''
    });

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const typesRes = await gatehouseService.getConfigs.types();
                setTypes(typesRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchConfigs();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const res = await gatehouseService.getHistory(filters);
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'NO_PATIO': { bg: '#eff6ff', text: '#2563eb', label: 'NO PÁTIO' },
            'FINALIZADO': { bg: '#ecfdf5', text: '#059669', label: 'FINALIZADO' },
            'CANCELADO': { bg: '#fff1f2', text: '#e11d48', label: 'CANCELADO' }
        };
        const s = styles[status] || styles['CANCELADO'];
        return (
            <span className="status-badge" style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.text}20` }}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="page-container gatehouse-history-page">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <button className="btn-icon-only tertiary" onClick={() => navigate('/gatehouse')} style={{ marginRight: '1rem' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-icon">
                            <History size={24} />
                        </div>
                        <h1>Histórico de Movimentação</h1>
                    </div>
                    <p>Consulta retroativa de fluxos, ocorrências e permanência</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Download size={18} />
                        Exportar Relatório
                    </button>
                </div>
            </header>

            <section className="content-card">
                <div className="filter-bar advanced">
                    <div className="filter-grid-premium">
                        <div className="filter-group">
                            <label className="filter-label">Período</label>
                            <div className="date-range-shorthand">
                                <input
                                    type="date"
                                    className="form-control sm"
                                    value={filters.data_inicio}
                                    onChange={e => setFilters({ ...filters, data_inicio: e.target.value })}
                                />
                                <span className="range-sep">até</span>
                                <input
                                    type="date"
                                    className="form-control sm"
                                    value={filters.data_fim}
                                    onChange={e => setFilters({ ...filters, data_fim: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Placa</label>
                            <div className="input-with-icon sm">
                                <Search size={14} />
                                <input
                                    type="text"
                                    className="form-control sm"
                                    placeholder="Buscar placa..."
                                    value={filters.placa}
                                    onChange={e => setFilters({ ...filters, placa: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Finalidade</label>
                            <select
                                className="form-control sm"
                                value={filters.tipo_acesso_id}
                                onChange={e => setFilters({ ...filters, tipo_acesso_id: e.target.value })}
                            >
                                <option value="">Todas</option>
                                {types.map(t => <option key={t._id} value={t._id}>{t.nome}</option>)}
                            </select>
                        </div>

                        <div className="filter-group action-align">
                            <button className="btn-primary sm" onClick={loadHistory}>
                                <Filter size={14} /> Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="table-container ivory-table">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Ticket</th>
                                <th>Entrada / Guarita</th>
                                <th>Saída / Estadia</th>
                                <th>Veículo / Placa</th>
                                <th>Responsável / Empresa</th>
                                <th>Tipo / Status</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(item => (
                                <tr key={item._id}>
                                    <td>
                                        <span className="ticket-id">#{item.ticket || item._id.slice(-6).toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <div className="datetime-cell">
                                            <span className="date">{new Date(item.dt_entrada).toLocaleDateString()}</span>
                                            <span className="time">{new Date(item.dt_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="location"><MapPin size={10} /> {(item.guarita_id as any)?.nome || 'Padrão'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {item.dt_saida ? (
                                            <div className="datetime-cell">
                                                <span className="date">{new Date(item.dt_saida).toLocaleDateString()}</span>
                                                <span className="time">{new Date(item.dt_saida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="duration">Total: {item.permanencia_min}min</span>
                                            </div>
                                        ) : (
                                            <span className="in-progress-marker">Ainda no pátio</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="plate-badge-premium">
                                            <span className="plate-text">{(item.veiculo_id as any).placa}</span>
                                            <span className="plate-type">{(item.veiculo_id as any).tipo_veiculo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-details">
                                                <span className="user-name">{(item.pessoa_id as any)?.nome || 'N/A'}</span>
                                                <span className="user-sub">{(item.empresa_id as any)?.nome_fantasia || 'Particular'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-cell-stacked">
                                            <span
                                                className="access-type-tag"
                                                style={{
                                                    color: (item.tipo_acesso_id as any).cor,
                                                    background: `${(item.tipo_acesso_id as any).cor}10`
                                                }}
                                            >
                                                {(item.tipo_acesso_id as any).nome}
                                            </span>
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button className="btn-icon-only tertiary" title="Ver Detalhes">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="empty-state-cell">
                                        Nenhum registro encontrado para os filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-pagination-info">
                    <span>Exibindo <strong>{history.length}</strong> registros históricos</span>
                </div>
            </section>
        </div>
    );

};
