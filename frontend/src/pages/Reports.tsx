import React, { useEffect, useState } from 'react';
import { assetService, maintenanceService, dashboardService, ticketService } from '../services';
import { BarChart3, PieChart, TrendingUp, DollarSign, AlertCircle, Calendar, Users, Download, FileText, Layers, ChevronRight, Activity } from 'lucide-react';
import './Reports.css';

export const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview'); // overview, assets, agents
    const [viewMode, setViewMode] = useState<'summary' | 'analytical'>('summary');

    // Dados
    const [assetReport, setAssetReport] = useState<any>(null);
    const [maintenanceStats, setMaintenanceStats] = useState<any>(null);
    const [maintenanceReport, setMaintenanceReport] = useState<any>(null);
    const [operationalData, setOperationalData] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [agentReport, setAgentReport] = useState<any[]>([]);

    // Controles
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    // Datas para filtro customizado (futuro), por enquanto usa period para calcular start/end
    const getDatesFromPeriod = (days: string) => {
        const daysInt = parseInt(days);
        if (isNaN(daysInt)) return { startDate: undefined, endDate: undefined };

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - daysInt);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    useEffect(() => {
        loadReports();
    }, [period]);

    const [agentActivityReport, setAgentActivityReport] = useState<any[]>([]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDatesFromPeriod(period);

            // Carregamento resiliente: se um falhar, os outros continuam
            const fetchSafe = async (fn: () => Promise<any>, setter: (data: any) => void, name: string) => {
                try {
                    const res = await fn();
                    setter(res.data || res);
                } catch (err) {
                    console.error(`Erro ao carregar ${name}:`, err);
                }
            };

            await Promise.all([
                fetchSafe(() => assetService.getReport(), setAssetReport, 'ativos'),
                fetchSafe(() => maintenanceService.getStats(), setMaintenanceStats, 'estatísticas de manutenção'),
                fetchSafe(() => maintenanceService.getReport(period), setMaintenanceReport, 'relatório de manutenção'),
                fetchSafe(() => dashboardService.getOperational(), setOperationalData, 'dados operacionais'),
                fetchSafe(() => dashboardService.getAlerts(), setAlerts, 'alertas'),
                fetchSafe(() => ticketService.getAgentReport(startDate, endDate), (data) => setAgentReport(Array.isArray(data) ? data : []), 'relatório de atendentes'),
                fetchSafe(() => ticketService.getAgentActivityReport(startDate, endDate), (data) => setAgentActivityReport(Array.isArray(data) ? data : []), 'atividade de atendentes')
            ]);

        } catch (error) {
            console.error('Erro crítico ao carregar relatórios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportAgents = async () => {
        try {
            const { startDate, endDate } = getDatesFromPeriod(period);
            const response = await ticketService.exportAgentReport(startDate, endDate);

            // Criar blob link para download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_atendentes_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar relatório');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando relatórios...</p></div>;
    }

    const severityColors: any = {
        critica: 'var(--danger)',
        alta: 'var(--warning)',
        media: 'var(--info)',
        baixa: 'var(--text-muted)'
    };

    return (
        <div className="reports-page-container">
            <header className="page-header">
                <div className="page-title-group">
                    <h1>Relatórios e Análises</h1>
                    <p className="page-subtitle">Visão estratégica e operacional do ambiente de TI</p>
                </div>
                <div className="header-actions">
                    <div className="filter-item">
                        <Calendar size={18} />
                        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                            <option value="7">Últimos 7 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Último ano</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Navegação de Abas */}
            <div className="reports-tabs">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                >
                    <PieChart size={18} /> Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
                >
                    <Layers size={18} /> Ativos Analítico
                </button>
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
                >
                    <Users size={18} /> Desempenho Atendentes
                </button>
            </div>

            {/* Conteúdo das Abas */}

            {/* ABA: Visão Geral (Overview) */}
            {activeTab === 'overview' && (
                <>
                    {/* Alertas */}
                    {alerts.length > 0 && (
                        <div className="reports-alert-banner">
                            <div className="report-section-header" style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <AlertCircle size={24} color="var(--danger)" />
                                    <h2 className="report-section-title" style={{ color: 'var(--danger-dark)' }}>Alertas Ativos ({alerts.length})</h2>
                                </div>
                            </div>
                            <div className="alert-grid">
                                {alerts.slice(0, 6).map((alert, index) => (
                                    <div key={index} className="alert-item-card" style={{ borderLeftColor: severityColors[alert.severity] }}>
                                        <div style={{ display: 'flex', justifyContent: 'end', marginBottom: '8px' }}>
                                            <span className={`badge badge-${alert.severity === 'critica' || alert.severity === 'alta' ? 'danger' : alert.severity === 'media' ? 'warning' : 'success'}`}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text)' }}>{alert.title}</h4>
                                        <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{alert.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cards de Métricas */}
                    <div className="reports-kpi-grid">
                        <div className="report-kpi-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                            <div className="report-kpi-info">
                                <p>Total de Ativos</p>
                                <h2>{operationalData?.assets?.total || 0}</h2>
                            </div>
                            <BarChart3 size={40} style={{ opacity: 0.3 }} />
                        </div>
                        <div className="report-kpi-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <div className="report-kpi-info">
                                <p>Custo Manutenções</p>
                                <h2>R$ {(maintenanceReport?.summary?.[0]?.totalCost || 0).toFixed(2)}</h2>
                            </div>
                            <DollarSign size={40} style={{ opacity: 0.3 }} />
                        </div>
                        <div className="report-kpi-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                            <div className="report-kpi-info">
                                <p>Valor Patrimonial</p>
                                <h2>R$ {(assetReport?.totalValue?.[0]?.total || 0).toFixed(2)}</h2>
                            </div>
                            <PieChart size={40} style={{ opacity: 0.3 }} />
                        </div>
                    </div>

                    <div className="analysis-grid">
                        {/* Ativos por Status */}
                        <div className="analysis-card">
                            <h3>Ativos por Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                {assetReport?.byStatus && assetReport.byStatus.length > 0 ? (
                                    assetReport.byStatus.map((item: any) => (
                                        <div key={item._id} style={{ padding: '20px', background: 'var(--surface-2)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1, marginBottom: '8px' }}>{item.count}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>{item._id || 'Indefinido'}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: 'span 2', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: '12px', fontWeight: 600 }}>
                                        Nenhum ativo registrado
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top 5 Peças */}
                        <div className="analysis-card">
                            <h3>Top Peças em Manutenção</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {maintenanceReport?.topParts && maintenanceReport.topParts.length > 0 ? (
                                    maintenanceReport.topParts.slice(0, 5).map((part: any, index: number) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '28px', height: '28px', background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{index + 1}</div>
                                                <span style={{ fontWeight: '700', color: 'var(--text)' }}>{part._id}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--text)' }}>{part.quantity}x</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>R$ {part.totalCost?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: '12px', fontWeight: 600 }}>
                                        Nenhuma peça em manutenção
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ABA: Ativos Analítico */}
            {activeTab === 'assets' && (
                <div className="analysis-card">
                    <div className="report-section-header">
                        <h2 className="report-section-title">Análise de Ativos por Setor</h2>
                        <button className="btn-secondary" onClick={() => window.print()}>
                            <FileText size={20} /> Imprimir Relatório
                        </button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Localização / Setor</th>
                                    <th className="text-center">Qtd. Ativos</th>
                                    <th className="text-center">% do Total</th>
                                    <th className="text-right">Valor Patrimonial</th>
                                    <th className="text-right">Valor Médio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!assetReport?.byLocation || assetReport.byLocation.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty-state">
                                            Nenhum dado de ativos por setor disponível.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {assetReport.byLocation.map((item: any) => {
                                            const totalAssets = assetReport.byLocation.reduce((acc: number, curr: any) => acc + curr.count, 0);
                                            const percent = ((item.count / totalAssets) * 100).toFixed(1);
                                            const avgValue = item.totalValue / item.count;

                                            return (
                                                <tr key={item._id}>
                                                    <td style={{ fontWeight: 700 }}>{item._id || 'Não Definido'}</td>
                                                    <td className="text-center" style={{ fontWeight: 800 }}>{item.count}</td>
                                                    <td className="text-center">
                                                        <div className="resolution-bar-container">
                                                            <div className="resolution-bar-bg">
                                                                <div className="resolution-bar-fill bg-green" style={{ width: `${percent}%` }}></div>
                                                            </div>
                                                            <span className="resolution-text">{percent}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-right" style={{ color: 'var(--success)', fontWeight: 800 }}>R$ {(item.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="text-right" style={{ color: 'var(--text-muted)' }}>R$ {(avgValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ background: 'var(--surface-2)', fontWeight: 800 }}>
                                            <td>TOTAIS</td>
                                            <td className="text-center">
                                                {assetReport.byLocation.reduce((acc: any, curr: any) => acc + curr.count, 0)}
                                            </td>
                                            <td className="text-center">100%</td>
                                            <td className="text-right" style={{ color: 'var(--success)' }}>
                                                R$ {assetReport.byLocation.reduce((acc: any, curr: any) => acc + (curr.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-right">-</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ABA: Desempenho Atendentes */}
            {activeTab === 'agents' && (
                <div className="analysis-card">
                    <div className="report-section-header">
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <h2 className="report-section-title">
                                {viewMode === 'analytical' ? 'Relatório Analítico de Tickets' : 'Produtividade da Equipe'}
                            </h2>
                            <div className="filters-bar">
                                <button
                                    onClick={() => setViewMode('summary')}
                                    className={`toggle-btn ${viewMode !== 'analytical' ? 'active' : ''}`}
                                >
                                    Resumido
                                </button>
                                <button
                                    onClick={() => setViewMode('analytical')}
                                    className={`toggle-btn ${viewMode === 'analytical' ? 'active' : ''}`}
                                >
                                    Analítico
                                </button>
                            </div>
                        </div>
                        <button className="btn-primary" style={{ backgroundColor: '#16a34a' }} onClick={handleExportAgents}>
                            <Download size={20} /> Exportar Excel
                        </button>
                    </div>

                    {viewMode === 'analytical' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {agentActivityReport.length === 0 ? (
                                <p className="empty-state">Nenhum dado encontrado.</p>
                            ) : (
                                agentActivityReport.map((agent: any) => (
                                    <div key={agent.agentEmail} className="agent-activity-box">
                                        <div className="agent-activity-header">
                                            <div className="agent-activity-info">
                                                <h3>{agent.agentName}</h3>
                                                <span>{agent.agentEmail}</span>
                                            </div>
                                            <span className="badge badge-info">
                                                {agent.tickets.length} tickets
                                            </span>
                                        </div>
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Ticket</th>
                                                        <th>Solicitante</th>
                                                        <th className="text-center">Status</th>
                                                        <th className="text-center">Setor</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {agent.tickets.map((ticket: any) => (
                                                        <tr key={ticket._id}>
                                                            <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontWeight: 800 }}>#{ticket.ticketNumber} - {ticket.title}</span>
                                                                </div>
                                                            </td>
                                                            <td>{ticket.requester?.name || ticket.contactName || '-'}</td>
                                                            <td className="text-center">
                                                                <span className={`status-badge status-${ticket.status}`}>
                                                                    {ticket.status}
                                                                </span>
                                                            </td>
                                                            <td className="text-center" style={{ color: 'var(--text-muted)' }}>{ticket.sector || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Atendente</th>
                                        <th className="text-center">Total Tickets</th>
                                        <th className="text-center">Resolvidos</th>
                                        <th className="text-center">Em Aberto</th>
                                        <th className="text-center">Resolução (h)</th>
                                        <th className="text-center">1ª Resp. (h)</th>
                                        <th className="text-center">Taxa Resolução</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agentReport.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="empty-state">
                                                Nenhum dado encontrado para o período selecionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        agentReport.map((agent: any) => {
                                            const resolutionRate = agent.totalTickets > 0 ? ((agent.resolvedTickets / agent.totalTickets) * 100).toFixed(0) : 0;
                                            return (
                                                <tr key={agent.email}>
                                                    <td>
                                                        <div className="agent-info">
                                                            <span className="agent-name">{agent.name}</span>
                                                            <span className="agent-email">{agent.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center" style={{ fontWeight: 800 }}>{agent.totalTickets}</td>
                                                    <td className="text-center" style={{ color: 'var(--success)', fontWeight: 800 }}>{agent.resolvedTickets}</td>
                                                    <td className="text-center" style={{ color: 'var(--warning)', fontWeight: 800 }}>{agent.openTickets}</td>
                                                    <td className="text-center" style={{ color: 'var(--text-muted)' }}>{agent.avgResolutionTimeHours ? agent.avgResolutionTimeHours.toFixed(1) : '-'}</td>
                                                    <td className="text-center" style={{ color: 'var(--text-muted)' }}>{agent.avgFirstResponseTimeHours ? agent.avgFirstResponseTimeHours.toFixed(1) : '-'}</td>
                                                    <td className="text-center">
                                                        <div className="resolution-bar-container">
                                                            <div className="resolution-bar-bg">
                                                                <div className={`resolution-bar-fill ${Number(resolutionRate) > 80 ? 'bg-green' : 'bg-amber'}`} style={{ width: `${resolutionRate}%` }}></div>
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
                    )}
                </div>
            )}
        </div>
    );
};
