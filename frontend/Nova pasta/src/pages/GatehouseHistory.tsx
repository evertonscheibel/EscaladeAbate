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
    Eye
} from 'lucide-react';
import { gatehouseService } from '../services/gatehouseService';
import { GatehouseAccess, AccessType } from '../types/gatehouse';
import './GatehouseHistory.css';

export const GatehouseHistory: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<GatehouseAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [types, setTypes] = useState<AccessType[]>([]);

    // Filtros
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
            const typesRes = await gatehouseService.getConfigs.types();
            setTypes(typesRes.data);
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
            'NO_PATIO': { bg: '#DBEAFE', text: '#1E40AF', label: 'NO PÁTIO' },
            'FINALIZADO': { bg: '#D1FAE5', text: '#065F46', label: 'FINALIZADO' },
            'CANCELADO': { bg: '#FEE2E2', text: '#991B1B', label: 'CANCELADO' }
        };
        const s = styles[status] || styles['CANCELADO'];
        return <span className="status-badge" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>;
    };

    return (
        <div className="gatehouse-history">
            <header className="history-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/gatehouse')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>Histórico de Movimentação</h1>
                </div>
                <div className="header-right">
                    <button className="btn-export">
                        <Download size={20} /> Exportar Excel
                    </button>
                </div>
            </header>

            <section className="filter-panel">
                <div className="filter-grid">
                    <div className="filter-item">
                        <label><Calendar size={16} /> Período</label>
                        <div className="date-range">
                            <input type="date" value={filters.data_inicio} onChange={e => setFilters({ ...filters, data_inicio: e.target.value })} />
                            <span>até</span>
                            <input type="date" value={filters.data_fim} onChange={e => setFilters({ ...filters, data_fim: e.target.value })} />
                        </div>
                    </div>
                    <div className="filter-item">
                        <label><Truck size={16} /> Placa</label>
                        <input type="text" placeholder="Buscar placa..." value={filters.placa} onChange={e => setFilters({ ...filters, placa: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="filter-item">
                        <label><Filter size={16} /> Tipo de Acesso</label>
                        <select value={filters.tipo_acesso_id} onChange={e => setFilters({ ...filters, tipo_acesso_id: e.target.value })}>
                            <option value="">Todos</option>
                            {types.map(t => <option key={t._id} value={t._id}>{t.nome}</option>)}
                        </select>
                    </div>
                    <div className="filter-item btn-filter-container">
                        <button className="btn-apply" onClick={loadHistory}>
                            <Search size={20} /> FILTRAR
                        </button>
                    </div>
                </div>
            </section>

            <main className="history-table-container">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Entrada</th>
                            <th>Saída</th>
                            <th>Stay</th>
                            <th>Veículo</th>
                            <th>Motorista</th>
                            <th>Empresa</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(item => (
                            <tr key={item._id}>
                                <td className="font-mono">{item.ticket}</td>
                                <td>{new Date(item.dt_entrada).toLocaleString('pt-BR')}</td>
                                <td>{item.dt_saida ? new Date(item.dt_saida).toLocaleString('pt-BR') : '-'}</td>
                                <td>{item.permanencia_min ? `${item.permanencia_min}min` : '-'}</td>
                                <td>
                                    <div className="compact-info">
                                        <strong>{(item.veiculo_id as any).placa}</strong>
                                        <span>{(item.veiculo_id as any).tipo_veiculo}</span>
                                    </div>
                                </td>
                                <td>{item.pessoa_id ? (item.pessoa_id as any).nome : 'N/A'}</td>
                                <td>{item.empresa_id ? (item.empresa_id as any).nome_fantasia : 'Particular'}</td>
                                <td>
                                    <span className="type-tag" style={{ borderColor: (item.tipo_acesso_id as any).cor }}>
                                        {(item.tipo_acesso_id as any).nome}
                                    </span>
                                </td>
                                <td>{getStatusBadge(item.status)}</td>
                                <td>
                                    <button className="btn-view" title="Ver Detalhes">
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && !loading && (
                    <div className="empty-history">Nenhum registro encontrado para os filtros selecionados.</div>
                )}
            </main>
        </div>
    );
};
