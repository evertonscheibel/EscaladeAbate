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
        <div className="gatehouse-dashboard">
            <header className="dashboard-header">
                <div className="header-info">
                    <h1>Módulo de Guaritas</h1>
                    <p>Controle de entrada e saída em tempo real</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/gatehouse/history')}>
                        <History size={20} />
                        Histórico Completo
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/gatehouse/entry')}>
                        <PlusCircle size={20} />
                        Nova Entrada
                    </button>
                </div>
            </header>

            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-icon"><Truck size={32} /></div>
                    <div className="kpi-content">
                        <h3>Entradas Hoje</h3>
                        <span className="kpi-value">{kpis?.entradas_hoje || 0}</span>
                    </div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-icon"><LogOut size={32} /></div>
                    <div className="kpi-content">
                        <h3>Saídas Hoje</h3>
                        <span className="kpi-value">{kpis?.saidas_hoje || 0}</span>
                    </div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-icon"><Clock size={32} /></div>
                    <div className="kpi-content">
                        <h3>Permanência Média</h3>
                        <span className="kpi-value">{kpis?.permanencia_media_min || 0}min</span>
                    </div>
                </div>
                <div className="kpi-card orange">
                    <div className="kpi-icon"><AlertTriangle size={32} /></div>
                    <div className="kpi-content">
                        <h3>No Pátio Agora</h3>
                        <span className="kpi-value">{kpis?.no_patio_agora || 0}</span>
                    </div>
                </div>
            </div>

            <section className="patio-section">
                <div className="section-header">
                    <h2>Veículos no Pátio</h2>
                    <div className="search-bar">
                        <Search size={20} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por placa, empresa ou motorista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {loading && <RefreshCw className="animate-spin text-indigo-500" size={20} />}
                    </div>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('todos')}
                    >
                        Todos no Pátio ({inPatio.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'comum' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comum')}
                    >
                        Veículos Comuns ({inPatio.filter(i => !((i.veiculo_id as any)?.tipo_veiculo || '').toLowerCase().includes('boiadeiro')).length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'boiadeiro' ? 'active' : ''}`}
                        onClick={() => setActiveTab('boiadeiro')}
                    >
                        Boiadeiros ({inPatio.filter(i => ((i.veiculo_id as any)?.tipo_veiculo || '').toLowerCase().includes('boiadeiro')).length})
                    </button>
                </div>

                <div className="table-container">
                    <table className="patio-table">
                        <thead>
                            <tr>
                                <th>Placa / Tipo</th>
                                <th>Motorista / Visitante</th>
                                <th>Empresa / Origem</th>
                                <th>Destino / Guarita</th>
                                <th>Permanência</th>
                                <th>Tipo de Acesso</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInPatio.map((access) => (
                                <tr key={access._id}>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className="plate-badge">{(access.veiculo_id as any).placa}</span>
                                            <span className="text-[10px] uppercase font-bold text-gray-400">{(access.veiculo_id as any).tipo_veiculo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-700">{(access.pessoa_id as any)?.nome || 'Visitante'}</span>
                                                <span className="text-xs text-slate-400">{(access.pessoa_id as any)?.documento || 'Sem doc.'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="font-medium text-slate-600">{(access.empresa_id as any)?.nome_fantasia || 'Particular'}</span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-slate-700 font-medium">{access.destino || 'Pátio Central'}</span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <MapPin size={10} /> {(access.guarita_id as any)?.nome || 'Guarita 01'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`time-cell ${isAlerta(access.dt_entrada) ? 'alert' : ''}`}>
                                            <Clock size={16} />
                                            <span>{calculateTimeInPatio(access.dt_entrada)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="type-badge"
                                            style={{
                                                backgroundColor: `${(access.tipo_acesso_id as any).cor}20`,
                                                color: (access.tipo_acesso_id as any).cor,
                                                border: `1px solid ${(access.tipo_acesso_id as any).cor}40`
                                            }}
                                        >
                                            {(access.tipo_acesso_id as any).nome}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-cell">
                                            <button
                                                className="btn-table-exit"
                                                onClick={() => navigate(`/gatehouse/exit/${access._id}`)}
                                            >
                                                REGISTRAR SAÍDA
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInPatio.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                                        Nenhum veículo encontrado no pátio para esta categoria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span>Exibindo <strong>{filteredInPatio.length}</strong> veículos ativos</span>
                    <span>Atualizado automaticamente via Socket/Pooling</span>
                </div>
            </section>
        </div>
    );
};
