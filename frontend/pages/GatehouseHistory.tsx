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
    MapPin
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
                        <label><Calendar size={16} /> Período de Busca</label>
                        <div className="date-range">
                            <input type="date" value={filters.data_inicio} onChange={e => setFilters({ ...filters, data_inicio: e.target.value })} />
                            <span className="text-gray-400 font-bold">»</span>
                            <input type="date" value={filters.data_fim} onChange={e => setFilters({ ...filters, data_fim: e.target.value })} />
                        </div>
                    </div>
                    <div className="filter-item">
                        <label><Truck size={16} /> Placa do Veículo</label>
                        <input
                            type="text"
                            placeholder="ABC1D23"
                            value={filters.placa}
                            onChange={e => setFilters({ ...filters, placa: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <div className="filter-item">
                        <label><Filter size={16} /> Meio / Finalidade</label>
                        <select value={filters.tipo_acesso_id} onChange={e => setFilters({ ...filters, tipo_acesso_id: e.target.value })}>
                            <option value="">Todas as finalidades</option>
                            {types.map(t => <option key={t._id} value={t._id}>{t.nome}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <button className="btn-apply" onClick={loadHistory}>
                            <Search size={20} /> PESQUISAR
                        </button>
                    </div>
                </div>
            </section>

            <main className="history-table-container">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Entrada / Guarita</th>
                            <th>Saída / Permanência</th>
                            <th>Veículo / Placa</th>
                            <th>Motorista / Empresa</th>
                            <th>Tipo / Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(item => (
                            <tr key={item._id}>
                                <td className="font-mono text-blue-600 font-bold">#{item.ticket || item._id.slice(-6).toUpperCase()}</td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700">{new Date(item.dt_entrada).toLocaleString('pt-BR')}</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <MapPin size={10} /> {(item.guarita_id as any)?.nome || 'Guarita Central'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700">{item.dt_saida ? new Date(item.dt_saida).toLocaleString('pt-BR') : '-'}</span>
                                        {item.permanencia_min && (
                                            <span className="text-xs text-indigo-500 font-bold">Total: {item.permanencia_min}min</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono bg-slate-800 text-white px-2 py-1 rounded text-xs w-fit">{(item.veiculo_id as any).placa}</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">{(item.veiculo_id as any).tipo_veiculo}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700">{item.pessoa_id ? (item.pessoa_id as any).nome : 'N/A'}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">{item.empresa_id ? (item.empresa_id as any).nome_fantasia : 'Condutor Particular'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col gap-2">
                                        <span className="type-tag" style={{ color: (item.tipo_acesso_id as any).cor, borderColor: `${(item.tipo_acesso_id as any).cor}40`, backgroundColor: `${(item.tipo_acesso_id as any).cor}10` }}>
                                            {(item.tipo_acesso_id as any).nome}
                                        </span>
                                        {getStatusBadge(item.status)}
                                    </div>
                                </td>
                                <td>
                                    <button className="btn-view" title="Ver Detalhes do Registro">
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {history.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="empty-history">
                                    Nenhum registro de movimentação encontrado para os critérios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </main>
        </div>
    );
};
