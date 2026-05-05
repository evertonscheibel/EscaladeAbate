import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ClipboardList,
    FileText,
    Map,
    QrCode
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { pacService } from '../services/pacService';
import './QualityDashboard.css';

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#3b82f6'];

export const QualityDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Futuramente implementaremos um endpoint de stats unificado
            // Por hora, simularemos ou buscaremos dados reais
            const executions = await pacService.getExecutions();
            const ncs = await pacService.getNonConformities();

            setStats({
                executions: {
                    total: executions.total,
                    today: executions.data.filter((e: any) => new Date(e.data_hora_abertura).toDateString() === new Date().toDateString()).length,
                    finalized: executions.data.filter((e: any) => e.status.includes('Finalizado')).length
                },
                ncs: {
                    open: ncs.data.filter((n: any) => n.status === 'Aberta').length,
                    overdue: ncs.data.filter((n: any) => n.status === 'Vencida').length
                },
                conformityRate: 94.5 // Mock por enquanto
            });
        } catch (error) {
            console.error('Erro ao carregar stats de qualidade:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Carregando indicadores...</div>;

    return (
        <div className="quality-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Dashboard de Qualidade (PAC)</h1>
                    <p>Monitoramento em tempo real dos Programas de Autocontrole</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary btn-execute" onClick={() => navigate('/quality/scanner')}>
                        <QrCode size={20} />
                        Nova Inspeção (Chão de Fábrica)
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/quality/executions')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon execution"><ClipboardList /></div>
                    <div className="stat-info">
                        <h3>Checklists Hoje</h3>
                        <p className="stat-value">{stats.executions.today}</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/quality/non-conformities?status=Aberta')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon nc"><AlertTriangle /></div>
                    <div className="stat-info">
                        <h3>NCs Abertas</h3>
                        <p className="stat-value text-red">{stats.ncs.open}</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/quality/non-conformities?status=Vencida')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon overdue"><XCircle /></div>
                    <div className="stat-info">
                        <h3>NCs Vencidas</h3>
                        <p className="stat-value text-red">{stats.ncs.overdue}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success"><CheckCircle /></div>
                    <div className="stat-info">
                        <h3>Conformidade</h3>
                        <p className="stat-value text-green">{stats.conformityRate}%</p>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-box">
                    <h3>Tendência de NCs (Últimos 30 dias)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[] /* Mock data */}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="ncs" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-box">
                    <h3>Conformidade por Área</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[] /* Mock data */}>
                            <XAxis dataKey="area" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="critical-alerts">
                <h3>⚠️ Alertas Críticos</h3>
                <div className="alerts-list">
                    {stats.ncs.overdue > 0 && (
                        <div className="alert-item high">
                            <AlertTriangle size={20} />
                            <span>Existem {stats.ncs.overdue} Não Conformidades críticas vencidas!</span>
                            <button className="btn-resolve">Ver agora</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
