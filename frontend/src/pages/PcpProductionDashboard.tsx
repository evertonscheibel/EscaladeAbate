import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, TrendingUp, Clock, CheckCircle2, Pause,
    PlayCircle, AlertTriangle, Timer, Gauge, ArrowLeft, Target, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import pcpService from '../services/pcpService';
import deboningService from '../services/deboningService';
import './PcpProductionDashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const PcpProductionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const today = format(new Date(), 'yyyy-MM-dd');
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<any>(null);
    const [schedule, setSchedule] = useState<any>(null);

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 30000); // Auto-refresh 30s
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [planData, schedData] = await Promise.allSettled([
                pcpService.getDayPlan(today),
                deboningService.getScheduleByDate(today)
            ]);
            if (planData.status === 'fulfilled') setPlan(planData.value);
            if (schedData.status === 'fulfilled') setSchedule(schedData.value);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Calcular KPIs a partir dos dados
    const lots = schedule?.lots || [];
    const totalCarcasses = lots.reduce((s: number, l: any) => s + (l.totalCarcassas || 0), 0);
    const completedLots = lots.filter((l: any) => l.status === 'FINALIZADO');
    const inProgressLots = lots.filter((l: any) => l.status === 'EM_EXECUCAO');
    const pausedLots = lots.filter((l: any) => l.status === 'PAUSADO');
    const pendingLots = lots.filter((l: any) => l.status === 'PENDENTE');

    const processedCarcasses = completedLots.reduce((s: number, l: any) => s + (l.totalCarcassas || 0), 0);
    const targetPerHour = plan?.capacity?.targetCarcassesPerHour || 100;
    const progress = totalCarcasses > 0 ? Math.round((processedCarcasses / totalCarcasses) * 100) : 0;

    // Tempo produtivo total
    const totalProdMin = lots.reduce((s: number, l: any) => s + (l.tempoProdutivoMin || 0), 0);
    const totalParadoMin = lots.reduce((s: number, l: any) => s + (l.tempoParadoMin || 0), 0);
    const oee = totalProdMin + totalParadoMin > 0
        ? Math.round((totalProdMin / (totalProdMin + totalParadoMin)) * 100)
        : 0;

    // Pç/h médio
    const avgPcH = lots.reduce((s: number, l: any) => {
        if (l.pecasPorHora && l.pecasPorHora > 0) return s + l.pecasPorHora;
        return s;
    }, 0);
    const countWithPcH = lots.filter((l: any) => l.pecasPorHora && l.pecasPorHora > 0).length;
    const averagePcH = countWithPcH > 0 ? Math.round(avgPcH / countWithPcH) : 0;

    // Status chart data
    const statusData = [
        { name: 'Finalizados', value: completedLots.length, color: '#10b981' },
        { name: 'Em Execução', value: inProgressLots.length, color: '#3b82f6' },
        { name: 'Pausados', value: pausedLots.length, color: '#f59e0b' },
        { name: 'Pendentes', value: pendingLots.length, color: '#94a3b8' }
    ].filter(s => s.value > 0);

    // Market data
    const marketData = plan ? [
        { name: 'Merc. Interno', planejado: plan.plannedByMarket?.MI || 0, realizado: plan.realizedByMarket?.MI || 0 },
        { name: 'Exportação', planejado: plan.plannedByMarket?.EXP || 0, realizado: plan.realizedByMarket?.EXP || 0 },
        { name: 'Indústria', planejado: plan.plannedByMarket?.IND || 0, realizado: plan.realizedByMarket?.IND || 0 }
    ] : [];

    if (loading && !plan && !schedule) {
        return <div className="loading-state">Carregando painel de produção...</div>;
    }

    return (
        <div className="pcp-dashboard-page">
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn-icon tertiary" onClick={() => navigate('/pcp/day/' + today)}>
                            <ArrowLeft />
                        </button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Gauge className="text-primary" size={24} />
                                <h1>Painel de Produção</h1>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                <span className="auto-refresh-badge">
                                    <Zap size={12} /> Auto-refresh 30s
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="prod-kpi-grid">
                <div className="prod-kpi-card primary">
                    <div className="prod-kpi-icon"><Target size={22} /></div>
                    <div className="prod-kpi-data">
                        <span className="prod-kpi-label">Progresso do Dia</span>
                        <span className="prod-kpi-value">{progress}%</span>
                        <div className="prod-progress-bar">
                            <div className="prod-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <span className="prod-kpi-sub">{processedCarcasses} / {totalCarcasses} carcaças</span>
                    </div>
                </div>

                <div className="prod-kpi-card info">
                    <div className="prod-kpi-icon"><Timer size={22} /></div>
                    <div className="prod-kpi-data">
                        <span className="prod-kpi-label">Pç/Hora Média</span>
                        <span className="prod-kpi-value">{averagePcH}</span>
                        <span className="prod-kpi-sub">Meta: {targetPerHour} pç/h</span>
                    </div>
                </div>

                <div className="prod-kpi-card success">
                    <div className="prod-kpi-icon"><Activity size={22} /></div>
                    <div className="prod-kpi-data">
                        <span className="prod-kpi-label">OEE (Eficiência)</span>
                        <span className="prod-kpi-value">{oee}%</span>
                        <span className="prod-kpi-sub">Prod: {totalProdMin}min | Parado: {totalParadoMin}min</span>
                    </div>
                </div>

                <div className="prod-kpi-card warning">
                    <div className="prod-kpi-icon"><Clock size={22} /></div>
                    <div className="prod-kpi-data">
                        <span className="prod-kpi-label">Tempo Parado</span>
                        <span className="prod-kpi-value">{totalParadoMin} min</span>
                        <span className="prod-kpi-sub">{pausedLots.length} OP(s) pausada(s)</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="prod-charts-grid">
                <div className="prod-chart-card">
                    <h3><Activity size={16} /> Status das Ordens de Produção</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={statusData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                        {statusData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">Nenhum lote programado</div>
                        )}
                    </div>
                </div>

                <div className="prod-chart-card">
                    <h3><TrendingUp size={16} /> Planejado vs Realizado (Mercado)</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        {marketData.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={marketData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                                    <Legend />
                                    <Bar dataKey="planejado" name="Planejado" fill="var(--text-muted)" opacity={0.3} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="realizado" name="Realizado" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">Sem dados de mercado</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lots Table */}
            <div className="content-card" style={{ marginTop: '24px' }}>
                <h3 style={{ padding: '20px 24px 0', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                    <PlayCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Ordens de Produção — Tempo Real
                </h3>
                <div className="table-container" style={{ padding: '16px 24px 24px' }}>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Lote</th>
                                <th>Origem</th>
                                <th>Carcaças</th>
                                <th>T. Produtivo</th>
                                <th>Pç/h</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Sem lotes programados para hoje</td></tr>
                            )}
                            {lots.map((lot: any) => (
                                <tr key={lot._id}>
                                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{lot.lotNumber}</td>
                                    <td>{lot.origin}</td>
                                    <td>{lot.totalCarcassas || 0}</td>
                                    <td>{lot.tempoProdutivoMin || 0} min</td>
                                    <td style={{ fontWeight: 700 }}>{lot.pecasPorHora || '-'}</td>
                                    <td>
                                        {lot.status === 'FINALIZADO' && <span className="status-badge-premium success"><CheckCircle2 size={12} /> Finalizado</span>}
                                        {lot.status === 'EM_EXECUCAO' && <span className="status-badge-premium info"><PlayCircle size={12} /> Executando</span>}
                                        {lot.status === 'PAUSADO' && <span className="status-badge-premium warning"><Pause size={12} /> Pausado</span>}
                                        {lot.status === 'PENDENTE' && <span className="status-badge-premium"><Clock size={12} /> Pendente</span>}
                                        {!lot.status && <span className="status-badge-premium"><Clock size={12} /> Aguardando</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PcpProductionDashboard;
