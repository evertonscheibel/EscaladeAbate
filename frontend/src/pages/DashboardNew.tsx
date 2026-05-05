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
            // O backend retorna { success: true, data: { ... KPIs ... } }
            // O dashboardService.getKPIs() já retorna response.data (que é o objeto com success e data)
            // Se o service retornar response.data diretamente, aqui pegamos .data
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


    return (
        <div className="dashboard-new">
            <header className="page-header">
                <div className="page-title-group">
                    <h1 className="premium-title">Dashboard Executivo</h1>
                    <p className="page-subtitle">Bem-vindo ao cockpit, {user?.name}</p>
                </div>
                <div className="header-actions">
                    <span className="current-time">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
            </header>

            {/* Alerta de Novos Chamados - Glassmorphism Red Alert */}
            {kpis?.tickets?.byStatus?.find((s: any) => s._id === 'aberto')?.count > 0 && (
                <div
                    className="alert-banner-glass"
                    onClick={() => navigate('/tickets?filter=aberto')}
                >
                    <div className="alert-icon-wrapper">
                        <AlertTriangle size={28} />
                    </div>
                    <div className="alert-text-content">
                        <h3>Atenção: {kpis?.tickets?.byStatus?.find((s: any) => s._id === 'aberto')?.count} novos chamados pendentes!</h3>
                        <p>Existem solicitações aguardando sua análise inicial. Clique para visualizar e priorizar o atendimento.</p>
                    </div>
                    <div className="alert-action-btn">
                        <TrendingUp size={22} />
                    </div>
                </div>
            )}

            <div className="kpi-grid-new simplified">
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
                            <TrendingUp size={16} /> Volume Geral
                        </span>
                    </div>
                </div>

                <div
                    className="kpi-card-new danger"
                    onClick={() => navigate('/tickets?filter=aberto')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="kpi-icon-wrapper">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="kpi-content">
                        <h3>Chamados Novos / Sem Responsável</h3>
                        <p className="kpi-value-new">{kpis?.tickets?.unassigned || 0}</p>
                        <span className="kpi-trend negative">Atenção Imediata</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid-simplified">
                <div
                    className="chart-card"
                    onClick={() => navigate('/tickets')}
                    style={{ cursor: 'pointer' }}
                >
                    <h3>Status dos Tickets</h3>
                    <ResponsiveContainer width="100%" height={340}>
                        <PieChart>
                            <Pie
                                data={ticketStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={110}
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
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart data={ticketPriorityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {ticketPriorityData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};
