import React, { useEffect, useState } from 'react';
import { assetService, maintenanceService, dashboardService, ticketService } from '../services';
import { BarChart3, PieChart, TrendingUp, DollarSign, AlertCircle, Calendar, Users, Download, FileText, Layers } from 'lucide-react';
import './Tickets.css';

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
        critica: '#dc2626',
        alta: '#f59e0b',
        media: '#3b82f6',
        baixa: '#64748b'
    };

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Relatórios e Análises</h1>
                    <p>Visão estratégica e operacional do ambiente de TI</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Período:</label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="365">Último ano</option>
                    </select>
                </div>
            </div>

            {/* Navegação de Abas */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: activeTab === 'overview' ? '#e0f2fe' : 'transparent',
                        color: activeTab === 'overview' ? '#0284c7' : '#64748b',
                        fontWeight: activeTab === 'overview' ? '600' : '500',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <PieChart size={18} /> Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: activeTab === 'assets' ? '#e0f2fe' : 'transparent',
                        color: activeTab === 'assets' ? '#0284c7' : '#64748b',
                        fontWeight: activeTab === 'assets' ? '600' : '500',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Layers size={18} /> Ativos Analítico
                </button>
                <button
                    onClick={() => setActiveTab('agents')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: activeTab === 'agents' ? '#e0f2fe' : 'transparent',
                        color: activeTab === 'agents' ? '#0284c7' : '#64748b',
                        fontWeight: activeTab === 'agents' ? '600' : '500',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
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
                        <div style={{ marginBottom: '24px', padding: '20px', background: '#fff1f2', borderRadius: '16px', border: '1px solid #fda4af' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <AlertCircle size={24} color="#e11d48" />
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#be123c' }}>Alertas Ativos ({alerts.length})</h2>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                                {alerts.slice(0, 6).map((alert, index) => (
                                    <div key={index} style={{ padding: '12px', background: 'white', borderRadius: '10px', borderLeft: `4px solid ${severityColors[alert.severity]}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'end', marginBottom: '4px' }}>
                                            <span style={{ padding: '2px 8px', background: severityColors[alert.severity], color: 'white', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{alert.severity}</span>
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{alert.title}</h4>
                                        <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>{alert.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cards de Métricas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 8px 0', opacity: 0.9 }}>Total de Ativos</p>
                                <h2 style={{ margin: 0, fontSize: '32px' }}>{operationalData?.assets?.total || 0}</h2>
                            </div>
                            <BarChart3 size={32} style={{ opacity: 0.8 }} />
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 8px 0', opacity: 0.9 }}>Custo Manutenções</p>
                                <h2 style={{ margin: 0, fontSize: '28px' }}>R$ {(maintenanceReport?.summary?.[0]?.totalCost || 0).toFixed(2)}</h2>
                            </div>
                            <DollarSign size={32} style={{ opacity: 0.8 }} />
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 8px 0', opacity: 0.9 }}>Valor Patrimonial</p>
                                <h2 style={{ margin: 0, fontSize: '28px' }}>R$ {(assetReport?.totalValue?.[0]?.total || 0).toFixed(2)}</h2>
                            </div>
                            <PieChart size={32} style={{ opacity: 0.8 }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                        {/* Ativos por Status */}
                        <div style={{ padding: '24px', background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Ativos por Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                {assetReport?.byStatus && assetReport.byStatus.length > 0 ? (
                                    assetReport.byStatus.map((item: any) => (
                                        <div key={item._id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{item.count}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{item._id || 'Indefinido'}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: 'span 2', padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                                        Nenhum ativo registrado
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top 5 Peças */}
                        <div style={{ padding: '24px', background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Top Peças em Manutenção</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {maintenanceReport?.topParts && maintenanceReport.topParts.length > 0 ? (
                                    maintenanceReport.topParts.slice(0, 5).map((part: any, index: number) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ fontWeight: '500', color: '#1e293b' }}>{part._id}</span>
                                            <span style={{ fontWeight: '600', color: '#64748b' }}>{part.quantity}x (R$ {part.totalCost?.toFixed(2)})</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
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
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Análise de Ativos por Setor</h2>
                        <button className="btn-primary" style={{ fontSize: '14px', padding: '8px 16px' }} onClick={() => window.print()}>
                            <FileText size={16} style={{ marginRight: '8px' }} /> Imprimir Relatório
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Localização / Setor</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Qtd. Ativos</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>% do Total</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Valor Patrimonial Total</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Valor Médio por Ativo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!assetReport?.byLocation || assetReport.byLocation.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
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
                                                <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px', color: '#1e293b', fontWeight: '500' }}>{item._id || 'Não Definido'}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>{item.count}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                            {percent}%
                                                            <div style={{ width: '50px', height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                                                                <div style={{ width: `${percent}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>R$ {(item.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>R$ {(avgValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                                            <td style={{ padding: '16px', color: '#1e293b' }}>TOTAIS</td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#1e293b' }}>
                                                {assetReport.byLocation.reduce((acc: any, curr: any) => acc + curr.count, 0)}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>100%</td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#059669' }}>
                                                R$ {assetReport.byLocation.reduce((acc: any, curr: any) => acc + (curr.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>-</td>
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
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                {viewMode === 'analytical' ? 'Relatório Analítico de Tickets' : 'Produtividade da Equipe'}
                            </h2>
                            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                                <button
                                    onClick={() => setViewMode('summary')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: viewMode !== 'analytical' ? 'white' : 'transparent',
                                        boxShadow: viewMode !== 'analytical' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: viewMode !== 'analytical' ? '#1e293b' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Resumido
                                </button>
                                <button
                                    onClick={() => setViewMode('analytical')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: viewMode === 'analytical' ? 'white' : 'transparent',
                                        boxShadow: viewMode === 'analytical' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: viewMode === 'analytical' ? '#1e293b' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Analítico
                                </button>
                            </div>
                        </div>
                        <button className="btn-primary" style={{ fontSize: '14px', padding: '8px 16px', backgroundColor: '#16a34a' }} onClick={handleExportAgents}>
                            <Download size={16} style={{ marginRight: '8px' }} /> Exportar Excel
                        </button>
                    </div>

                    {viewMode === 'analytical' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {agentActivityReport.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Nenhum dado encontrado.</p>
                            ) : (
                                agentActivityReport.map((agent: any) => (
                                    <div key={agent.agentEmail} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{agent.agentName}</h3>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>{agent.agentEmail}</span>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: '600', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px' }}>
                                                {agent.tickets.length} tickets
                                            </span>
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#fff' }}>
                                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Data</th>
                                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Ticket</th>
                                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Solicitante</th>
                                                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Status</th>
                                                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Setor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agent.tickets.map((ticket: any) => (
                                                    <tr key={ticket._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                        <td style={{ padding: '10px 16px', color: '#334155' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                        <td style={{ padding: '10px 16px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: '500', color: '#0f172a' }}>#{ticket.ticketNumber} - {ticket.title}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '10px 16px', color: '#334155' }}>{ticket.requester?.name || ticket.contactName || '-'}</td>
                                                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
                                                                background: ticket.status === 'resolvido' ? '#dcfce7' : ticket.status === 'aberto' ? '#fee2e2' : '#fef3c7',
                                                                color: ticket.status === 'resolvido' ? '#166534' : ticket.status === 'aberto' ? '#991b1b' : '#92400e'
                                                            }}>
                                                                {ticket.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b' }}>{ticket.sector || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Atendente</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Total Tickets</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Resolvidos</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Em Aberto</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Tempo Resolução (h)</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Tempo 1ª Resp. (h)</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Taxa Resolução</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agentReport.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                                Nenhum dado encontrado para o período selecionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        agentReport.map((agent: any) => {
                                            const resolutionRate = agent.totalTickets > 0 ? ((agent.resolvedTickets / agent.totalTickets) * 100).toFixed(0) : 0;
                                            return (
                                                <tr key={agent.email} style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <td style={{ padding: '16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: '600', color: '#334155' }}>{agent.name}</span>
                                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{agent.email}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>{agent.totalTickets}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>{agent.resolvedTickets}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center', color: '#f59e0b', fontWeight: '600' }}>{agent.openTickets}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>{agent.avgResolutionTimeHours ? agent.avgResolutionTimeHours.toFixed(1) : '-'}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>{agent.avgFirstResponseTimeHours ? agent.avgFirstResponseTimeHours.toFixed(1) : '-'}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginRight: '8px' }}>
                                                                <div style={{
                                                                    width: `${resolutionRate}%`,
                                                                    height: '100%',
                                                                    background: Number(resolutionRate) > 80 ? '#10b981' : '#f59e0b',
                                                                    borderRadius: '3px',
                                                                    transition: 'width 1s ease-in-out'
                                                                }}></div>
                                                            </div>
                                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{resolutionRate}%</span>
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
