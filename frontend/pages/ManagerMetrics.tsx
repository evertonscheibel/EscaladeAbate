
import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';
import { useAuth } from '../context/AuthContext';
import {
    Activity,
    Users,
    CheckCircle,
    Clock,
    AlertTriangle,
    BarChart2,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import './ManagerMetrics.css';

export const ManagerMetrics: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [agentReport, setAgentReport] = useState<any[]>([]);
    const [period, setPeriod] = useState('30');

    const getDatesFromPeriod = (days: string) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - parseInt(days));
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDatesFromPeriod(period);

            const [statsRes, agentRes] = await Promise.all([
                ticketService.getStats(), // Need to check if this supports date filtering or implies all time. 
                // The current getStats implementation in backend (viewed earlier) 
                // doesn't seem to take query params for date, but let's check.
                // Actually, let's use getAgentReport for the team table.
                ticketService.getAgentReport(startDate, endDate)
            ]);

            setStats(statsRes.data);

            // Handle agent report data
            const agentData = Array.isArray(agentRes) ? agentRes : (agentRes?.data || []);
            setAgentReport(Array.isArray(agentData) ? agentData : []);

        } catch (error) {
            console.error('Erro ao carregar métricas gerenciais:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    // Calculate totals from agent report for a quick overview if stats endpoint doesn't support dates
    const calculateOverview = () => {
        if (!agentReport.length) return {
            total: 0,
            resolved: 0,
            open: 0,
            slaBreached: 0
        };

        return agentReport.reduce((acc, curr) => ({
            total: acc.total + curr.totalTickets,
            resolved: acc.resolved + curr.resolvedTickets,
            open: acc.open + curr.openTickets,
            slaBreached: acc.slaBreached + (curr.slaBreachedTickets || 0),
            critical: acc.critical + (curr.criticalTickets || 0),
            high: acc.high + (curr.highTickets || 0)
        }), { total: 0, resolved: 0, open: 0, slaBreached: 0, critical: 0, high: 0 });
    };

    const overview = calculateOverview();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="manager-metrics-container">
            <div className="metrics-header">
                <div className="metrics-title">
                    <h1>Métricas Gerenciais</h1>
                    <p>Visão global do sistema e performance da equipe</p>
                </div>
                <div className="header-actions">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="period-select"
                    >
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="365">Último ano</option>
                    </select>
                    <button onClick={loadData} className="refresh-btn">
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-card-header">
                        <div className="icon-wrapper icon-blue">
                            <Activity size={24} />
                        </div>
                        <span className="metric-value">{overview.total}</span>
                    </div>
                    <h3 className="metric-title">Total de Tickets</h3>
                    <p className="metric-description">No período selecionado</p>
                </div>

                <div className="metric-card">
                    <div className="metric-card-header">
                        <div className="icon-wrapper icon-green">
                            <CheckCircle size={24} />
                        </div>
                        <span className="metric-value">{overview.resolved}</span>
                    </div>
                    <h3 className="metric-title">Resolvidos</h3>
                    <p className="metric-description">Tickets finalizados</p>
                </div>

                <div className="metric-card">
                    <div className="metric-card-header">
                        <div className="icon-wrapper icon-yellow">
                            <Clock size={24} />
                        </div>
                        <span className="metric-value">{overview.open}</span>
                    </div>
                    <h3 className="metric-title">Em Aberto</h3>
                    <p className="metric-description">Tickets pendentes</p>
                </div>

                <div className="metric-card">
                    <div className="metric-card-header">
                        <div className="icon-wrapper icon-red">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="metric-value">{overview.slaBreached}</span>
                    </div>
                    <h3 className="metric-title">Violações de SLA</h3>
                    <p className="metric-description">Tickets fora do prazo</p>
                </div>
            </div>

            {/* Team Performance Table */}
            <div className="section-container">
                <div className="section-header">
                    <Users size={20} className="text-slate-500" />
                    <h2>Desempenho da Equipe</h2>
                </div>
                <div className="table-wrapper">
                    <table className="metrics-table">
                        <thead>
                            <tr>
                                <th>Atendente</th>
                                <th className="text-center">Total</th>
                                <th className="text-center">Prioridades</th>
                                <th className="text-center">Resolvidos</th>
                                <th className="text-center">Em Aberto</th>
                                <th className="text-center">SLA Violados</th>
                                <th className="text-center">Tempo Médio (h)</th>
                                <th className="text-center">Taxa Resolução</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agentReport.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-state">
                                        Nenhum dado encontrado para o período.
                                    </td>
                                </tr>
                            ) : (
                                agentReport.map((agent: any) => {
                                    const resolutionRate = agent.totalTickets > 0
                                        ? ((agent.resolvedTickets / agent.totalTickets) * 100).toFixed(0)
                                        : 0;

                                    return (
                                        <tr key={agent.email}>
                                            <td className="agent-cell">
                                                <div className="agent-info">
                                                    <span className="agent-name">{agent.name}</span>
                                                    <span className="agent-email">{agent.email}</span>
                                                </div>
                                            </td>
                                            <td className="text-center font-bold">{agent.totalTickets}</td>
                                            <td className="text-center">
                                                <div className="priority-distribution">
                                                    {agent.criticalTickets > 0 && <span className="p-badge p-critical" title="Crítica">{agent.criticalTickets}C</span>}
                                                    {agent.highTickets > 0 && <span className="p-badge p-high" title="Alta">{agent.highTickets}A</span>}
                                                    {agent.mediumTickets > 0 && <span className="p-badge p-medium" title="Média">{agent.mediumTickets}M</span>}
                                                    {agent.lowTickets > 0 && <span className="p-badge p-low" title="Baixa">{agent.lowTickets}B</span>}
                                                    {agent.totalTickets === 0 && <span className="text-slate-400">-</span>}
                                                </div>
                                            </td>
                                            <td className="text-center text-green-600 font-bold">{agent.resolvedTickets}</td>
                                            <td className="text-center text-amber-600 font-bold">{agent.openTickets}</td>
                                            <td className="text-center text-red-500 font-bold">{agent.slaBreachedTickets || 0}</td>
                                            <td className="text-center text-slate-500">
                                                {agent.avgResolutionTimeHours ? agent.avgResolutionTimeHours.toFixed(1) : '-'}
                                            </td>
                                            <td>
                                                <div className="resolution-bar-container">
                                                    <div className="resolution-bar-bg">
                                                        <div
                                                            className={`resolution-bar-fill ${Number(resolutionRate) > 80 ? 'bg-green' : 'bg-amber'}`}
                                                            style={{ width: `${resolutionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="resolution-text">{resolutionRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
