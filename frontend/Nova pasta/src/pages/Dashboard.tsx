import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
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
        return <div className="loading">Carregando...</div>;
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Dashboard - Sistema de Gestão de TI</h1>
                    <div className="user-info">
                        <span>Olá, {user?.name}</span>
                        <span className="role-badge">{user?.role}</span>
                        <button onClick={logout} className="btn-logout">Sair</button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon">🎫</div>
                        <div className="kpi-info">
                            <h3>Total de Tickets</h3>
                            <p className="kpi-value">{kpis?.tickets?.total || 0}</p>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon">⏱️</div>
                        <div className="kpi-info">
                            <h3>Tempo Médio de Resolução</h3>
                            <p className="kpi-value">
                                {kpis?.tickets?.avgResolutionTimeHours?.toFixed(1) || 0}h
                            </p>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon">💻</div>
                        <div className="kpi-info">
                            <h3>Total de Ativos</h3>
                            <p className="kpi-value">{kpis?.assets?.total || 0}</p>
                        </div>
                    </div>

                    <div className="kpi-card alert">
                        <div className="kpi-icon">⚠️</div>
                        <div className="kpi-info">
                            <h3>Certificados Críticos</h3>
                            <p className="kpi-value">{kpis?.certificates?.critical || 0}</p>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon">💰</div>
                        <div className="kpi-info">
                            <h3>Boletos Pendentes</h3>
                            <p className="kpi-value">{kpis?.boletos?.pending || 0}</p>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon">📚</div>
                        <div className="kpi-info">
                            <h3>Artigos na Base</h3>
                            <p className="kpi-value">{kpis?.knowledgeBase?.total || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="status-section">
                    <h2>Status dos Tickets</h2>
                    <div className="status-grid">
                        {kpis?.tickets?.byStatus?.map((item: any) => (
                            <div key={item._id} className="status-item">
                                <span className="status-label">{item._id}</span>
                                <span className="status-count">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="priority-section">
                    <h2>Prioridade dos Tickets</h2>
                    <div className="priority-grid">
                        {kpis?.tickets?.byPriority?.map((item: any) => (
                            <div key={item._id} className={`priority-item priority-${item._id}`}>
                                <span className="priority-label">{item._id}</span>
                                <span className="priority-count">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-section">
                    <h2>Bem-vindo ao Sistema de Gestão de TI! 🚀</h2>
                    <p>
                        Este é um sistema completo para gerenciamento de TI com as seguintes funcionalidades:
                    </p>
                    <ul>
                        <li>✅ Gestão de Chamados (Tickets)</li>
                        <li>✅ Controle de Ativos</li>
                        <li>✅ Gerenciamento de Certificados e Licenças</li>
                        <li>✅ Base de Conhecimento</li>
                        <li>✅ Controle de Boletos</li>
                        <li>✅ Dashboard com KPIs</li>
                        <li>✅ Sistema de Notificações</li>
                        <li>✅ Alertas Automáticos</li>
                    </ul>
                    <p>
                        <strong>Próximos passos:</strong> Explore os módulos através do menu lateral
                        (em desenvolvimento) ou utilize a API diretamente.
                    </p>
                </div>
            </div>
        </div>
    );
};
