import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Play,
    CheckCircle2,
    Settings,
    TrendingUp,
    ArrowRightLeft,
    Clock,
    Users,
    Thermometer,
    BarChart,
    Factory,
    Beef
} from 'lucide-react';

import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './PcpDayPlan.css';
import pcpService from '../services/pcpService';
import { PcpDayPlan } from '../types/pcp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PcpDayPlanPage: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<PcpDayPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (date) fetchPlan();
    }, [date]);

    const fetchPlan = async () => {
        try {
            setLoading(true);
            const data = await pcpService.getDayPlan(date!);
            setPlan(data);

        } catch (error) {
            alert('Erro ao carregar plano PCP');
        } finally {

            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!plan) return;
        try {
            await pcpService.startDayPlan(plan._id);
            alert('Plano do dia iniciado');
            fetchPlan();
        } catch (error) {
            alert('Erro ao iniciar');
        }

    };

    if (loading) return <div className="loading-state">Calculando planejamento...</div>;
    if (!plan) return <div>Erro ao carregar.</div>;

    const chartData = [
        { name: 'MI', Planejado: plan.plannedByMarket?.MI || 0, Realizado: plan.realizedByMarket?.MI || 0 },
        { name: 'EXP', Planejado: plan.plannedByMarket?.EXP || 0, Realizado: plan.realizedByMarket?.EXP || 0 },
        { name: 'IND', Planejado: plan.plannedByMarket?.IND || 0, Realizado: plan.realizedByMarket?.IND || 0 },
    ];


    return (
        <div className="pcp-day-container">
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn-icon tertiary" onClick={() => navigate('/pcp')}>
                            <ChevronLeft />
                        </button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ArrowRightLeft className="text-primary" size={24} />
                                <h1>Controle Diário - {format(new Date(date!), 'dd/MM/yyyy', { locale: ptBR })}</h1>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <span className={`status-badge-premium ${plan.status.toLowerCase() === 'draft' ? 'warning' : plan.status.toLowerCase() === 'in_progress' ? 'info' : 'success'}`}>
                                    {plan.status === 'DRAFT' ? 'PLANEJAMENTO' : plan.status === 'IN_PROGRESS' ? 'EM EXECUÇÃO' : 'FECHADO'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    {plan.status === 'DRAFT' && (
                        <button className="btn-primary" onClick={handleStart}>
                            <Play size={18} fill="currentColor" /> Iniciar Dia
                        </button>
                    )}
                    <button className="btn-secondary" onClick={() => navigate('/pcp/reports')}>
                        <BarChart size={18} /> Relatórios
                    </button>
                </div>
            </header>

            <div className="pcp-grid">
                {/* Painel Abate */}
                <div className="pcp-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Factory size={18} />
                            <h3>Abate Diário</h3>
                        </div>
                        <button onClick={() => navigate(`/slaughter-closure/${date}`)}>Ver Fechamento SIF</button>
                    </div>
                    <div className="panel-stats">
                        <div className="stat">
                            <span className="label">Total Animais</span>
                            <span className="value">{plan.totalSlaughterCattle} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Cabeças</span></span>
                        </div>
                        <div className={`status-box ${plan.links?.closureId ? 'ok' : 'pending'}`}>
                            {plan.links?.closureId ? 'SIF FECHADO' : 'SIF PENDENTE'}
                        </div>
                    </div>
                </div>

                {/* Painel Desossa */}
                <div className="pcp-panel desossa">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Beef size={18} />
                            <h3>Desossa</h3>
                        </div>
                        <button onClick={() => navigate(`/deboning/schedules/${date}`)}>Gerenciar Escala</button>
                    </div>
                    <div className="panel-stats">
                        <div className="stat">
                            <span className="label">Total Carcaças</span>
                            <span className="value">{plan.totalDeboningCarcasses} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Carc.</span></span>
                        </div>
                        <div className="status-box ok" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                            Ext: {plan.totalExternalLots}
                        </div>
                    </div>
                </div>

                {/* Painel Capacidade */}
                <div className="pcp-panel capacidade">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={18} />
                            <h3>Capacidade</h3>
                        </div>
                        <Settings size={16} color="var(--text-muted)" />
                    </div>
                    <div className="cap-list">
                        <div className="cap-item">
                            <Clock size={18} color="var(--primary)" />
                            <span>Taxa Meta: <strong>{plan.capacity.targetCarcassesPerHour} carcs/h</strong></span>
                        </div>
                        <div className="cap-item">
                            <Users size={18} color="var(--primary)" />
                            <span>Equipes: <strong>{plan.capacity.shifts.length} Turno(s)</strong></span>
                        </div>
                        <div className="cap-item">
                            <Thermometer size={18} color="var(--primary)" />
                            <span>Câmara Fria: <strong>{plan.capacity.coldRoomCapacity || '-'}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Painel Indicadores */}
                <div className="pcp-panel full-width">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} />
                            <h3>Planejado vs Realizado (por Mercado)</h3>
                        </div>
                        <BarChart size={16} color="var(--text-muted)" />
                    </div>
                    <div className="chart-wrapper" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-2)' }}
                                    cursor={{ fill: 'var(--surface-2)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Planejado" fill="var(--text-muted)" radius={[4, 4, 0, 0]} barSize={40} opacity={0.3} />
                                <Bar dataKey="Realizado" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PcpDayPlanPage;
