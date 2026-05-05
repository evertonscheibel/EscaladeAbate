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
    User
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
        const interval = setInterval(loadData, 30000); // Auto-refresh a cada 30s
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
        return diffHours > 4; // Alerta se mais de 4h
    };

    return (
        <div className="gatehouse-dashboard">
            <header className="dashboard-header">
                <div className="header-info">
                    <h1>Módulo de Guaritas</h1>
                    <p>Controle de entrada e saída de veículos</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/gatehouse/history')}>
                        <History size={20} />
                        Histórico
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/gatehouse/entry')}>
                        <PlusCircle size={20} />
                        Nova Entrada
                    </button>
                </div>
            </header>

            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-icon"><Truck /></div>
                    <div className="kpi-content">
                        <h3>Entradas Hoje</h3>
                        <span className="kpi-value">{kpis?.entradas_hoje || 0}</span>
                    </div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-icon"><LogOut /></div>
                    <div className="kpi-content">
                        <h3>Saídas Hoje</h3>
                        <span className="kpi-value">{kpis?.saidas_hoje || 0}</span>
                    </div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-icon"><Clock /></div>
                    <div className="kpi-content">
                        <h3>Permanência Média</h3>
                        <span className="kpi-value">{kpis?.permanencia_media_min || 0}min</span>
                    </div>
                </div>
                <div className="kpi-card orange">
                    <div className="kpi-icon"><AlertTriangle /></div>
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
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por placa, empresa ou motorista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {loading && <RefreshCw className="animate-spin" size={20} />}
                    </div>
                </div>

                <div className="patio-grid">
                    {inPatio.map((access) => (
                        <div key={access._id} className={`patio-card ${isAlerta(access.dt_entrada) ? 'alert' : ''}`}>
                            <div className="card-top">
                                <div className="vehicle-info">
                                    <span className="plate">{(access.veiculo_id as any).placa}</span>
                                    <span className="type">{(access.veiculo_id as any).tipo_veiculo}</span>
                                </div>
                                <div className="access-type" style={{ color: (access.tipo_acesso_id as any).cor }}>
                                    {(access.tipo_acesso_id as any).nome}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="info-row">
                                    <strong>Empresa:</strong>
                                    <span>{(access.empresa_id as any)?.nome_fantasia || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <strong>Motorista:</strong>
                                    <span>{(access.pessoa_id as any)?.nome || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <strong>Destino:</strong>
                                    <span>{access.destino || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <div className="time-info">
                                    <Clock size={16} />
                                    <span>{calculateTimeInPatio(access.dt_entrada)} no pátio</span>
                                </div>
                                <button
                                    className="btn-exit"
                                    onClick={() => navigate(`/gatehouse/exit/${access._id}`)}
                                >
                                    REGISTRAR SAÍDA
                                </button>
                            </div>
                        </div>
                    ))}
                    {inPatio.length === 0 && !loading && (
                        <div className="empty-patio"> Nenhum veículo no pátio momento.</div>
                    )}
                </div>
            </section>
        </div>
    );
};
