import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import './DashboardNew.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

export const DashboardNew: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadKPIs();
    }, []);

    const loadKPIs = async () => {
        try {
            const response = await dashboardService.getKPIs();
            setKpis(response.data);
        } catch (error) {
            console.error('Erro ao carregar KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    // Preparar dados para gráficos
    const ticketStatusData = kpis?.tickets?.byStatus?.map((item: any) => ({
        name: item._id,
        value: item.count
    })) || [];

    const ticketPriorityData = kpis?.tickets?.byPriority?.map((item: any) => ({
        name: item._id,
        value: item.count
    })) || [];

    const assetStatusData = kpis?.assets?.byStatus?.map((item: any) => ({
        name: item._id,
        value: item.count
    })) || [];

    return (
        <div className="dashboard-new">
            <div className="dashboard-header-new">
                <div>
                    <h1>Dashboard</h1>
                    <p>Bem-vindo, {user?.name}!</p>
                </div>
                <div className="header-actions">
                    <span className="current-time">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
            </div>

            {/* Alerta de Novos Chamados */}
            {kpis?.tickets?.byStatus?.find((s: any) => s._id === 'aberto')?.count > 0 && (
                <div
                    className="alert-banner"
                    onClick={() => navigate('/tickets?filter=aberto')}
                    style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
                        <AlertTriangle size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600 }}>
                            Atenção: {kpis?.tickets?.byStatus?.find((s: any) => s._id === 'aberto')?.count} novos chamados pendentes!
                        </h3>
                        <p style={{ margin: 0, opacity: 0.9 }}>
                            Existem solicitações aguardando sua análise. Clique para resolver.
                        </p>
                    </div>
                    <div style={{ marginLeft: 'auto', backgroundColor: 'white', padding: '8px', borderRadius: '50%' }}>
                        <TrendingUp size={20} color="#ef4444" />
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="kpi-grid-new">
                <div
                    className="kpi-card-new primary"
                    onClick={() => navigate('/tickets')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="kpi-icon-wrapper">
                        <CheckCircle size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Total de Tickets</h3>
                        <p className="kpi-value-new">{kpis?.tickets?.total || 0}</p>
                        <span className="kpi-trend positive">
                            <TrendingUp size={16} /> +12% este mês
                        </span>
                    </div>
                </div>

                <div className="kpi-card-new success">
                    <div className="kpi-icon-wrapper">
                        <Clock size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Tempo Médio</h3>
                        <p className="kpi-value-new">
                            {kpis?.tickets?.avgResolutionTimeHours?.toFixed(1) || 0}h
                        </p>
                        <span className="kpi-trend positive">
                            <TrendingDown size={16} /> -8% este mês
                        </span>
                    </div>
                </div>

                <div
                    className="kpi-card-new info"
                    onClick={() => navigate('/assets')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="kpi-icon-wrapper">
                        <CheckCircle size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Total de Ativos</h3>
                        <p className="kpi-value-new">{kpis?.assets?.total || 0}</p>
                        <span className="kpi-trend neutral">Estável</span>
                    </div>
                </div>

                <div
                    className="kpi-card-new warning"
                    onClick={() => navigate('/certificates')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="kpi-icon-wrapper">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Certificados Críticos</h3>
                        <p className="kpi-value-new">{kpis?.certificates?.critical || 0}</p>
                        <span className="kpi-trend negative">Atenção necessária</span>
                    </div>
                </div>

                <div
                    className="kpi-card-new danger"
                    onClick={() => navigate('/boletos')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="kpi-icon-wrapper">
                        <XCircle size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Boletos Pendentes</h3>
                        <p className="kpi-value-new">{kpis?.boletos?.pending || 0}</p>
                        <span className="kpi-trend neutral">
                            {kpis?.boletos?.overdue || 0} atrasados
                        </span>
                    </div>
                </div>

                <div
                    className="kpi-card-new secondary"
                    onClick={() => navigate('/knowledge-base')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="kpi-icon-wrapper">
                        <CheckCircle size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Artigos KB</h3>
                        <p className="kpi-value-new">{kpis?.knowledgeBase?.total || 0}</p>
                        <span className="kpi-trend positive">
                            {kpis?.knowledgeBase?.totalViews || 0} visualizações
                        </span>
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="charts-grid">
                <div
                    className="chart-card"
                    onClick={() => navigate('/tickets')}
                    style={{ cursor: 'pointer' }}
                >
                    <h3>Status dos Tickets</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={ticketStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {ticketStatusData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div
                    className="chart-card"
                    onClick={() => navigate('/tickets')}
                    style={{ cursor: 'pointer' }}
                >
                    <h3>Prioridade dos Tickets</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ticketPriorityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#667eea" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div
                    className="chart-card"
                    onClick={() => navigate('/assets')}
                    style={{ cursor: 'pointer' }}
                >
                    <h3>Status dos Ativos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={assetStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {assetStatusData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Artigos Mais Vistos */}
            {kpis?.knowledgeBase?.topArticles && kpis.knowledgeBase.topArticles.length > 0 && (
                <div className="top-articles-section">
                    <h3>Artigos Mais Vistos</h3>
                    <div className="articles-list">
                        {kpis.knowledgeBase.topArticles.map((article: any, index: number) => (
                            <div key={article._id} className="article-item">
                                <span className="article-rank">#{index + 1}</span>
                                <div className="article-info">
                                    <h4>{article.title}</h4>
                                    <span className="article-category">{article.category}</span>
                                </div>
                                <span className="article-views">{article.views} visualizações</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
