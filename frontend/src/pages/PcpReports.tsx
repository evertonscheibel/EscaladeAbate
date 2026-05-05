import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    Calendar,
    Download,
    Filter,
    Beef,
    Factory,
    PieChart as PieChartIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import pcpService from '../services/pcpService';
import './DeboningScheduleNew.css'; // Reaproveitando estilos premium

export const PcpReports: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    const [stats, setStats] = useState<any>({
        totalProduced: 0,
        avgYield: 0,
        trend: 'up',
        yieldByDay: [],
        productionByShift: [],
        topProducts: []
    });

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Mocking for now as we need to implement the backend aggregator
            // In a real scenario, we would call pcpService.getReports(dateRange)
            setTimeout(() => {
                setStats({
                    totalProduced: 124500,
                    avgYield: 78.4,
                    trend: 'up',
                    yieldByDay: [
                        { day: '01/03', yield: 77.2, prod: 4200 },
                        { day: '02/03', yield: 78.5, prod: 4500 },
                        { day: '03/03', yield: 79.1, prod: 4800 },
                        { day: '04/03', yield: 78.0, prod: 4100 },
                        { day: '05/03', yield: 78.8, prod: 4600 },
                        { day: '06/03', yield: 79.5, prod: 4900 },
                        { day: '07/03', yield: 78.2, prod: 4300 },
                    ],
                    productionByShift: [
                        { name: 'Turno A', value: 45 },
                        { name: 'Turno B', value: 35 },
                        { name: 'Turno C', value: 20 },
                    ],
                    topProducts: [
                        { name: 'Picanha', weight: 1200 },
                        { name: 'File Mignon', weight: 950 },
                        { name: 'Alcatra', weight: 1800 },
                        { name: 'Contra File', weight: 2200 },
                        { name: 'Coxao Mole', weight: 3100 },
                    ]
                });
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="pcp-day-container">
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn-icon tertiary" onClick={() => navigate('/pcp')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1>Relatórios PCP & Performance</h1>
                            <p>Análise de rendimento, produtividade e custos operacionais</p>
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="filter-bar-premium">
                        <Calendar size={18} />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="separator">até</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button className="btn-secondary">
                        <Download size={20} /> Exportar
                    </button>
                </div>
            </header>

            <div className="reports-kpi-grid">
                <div className="kpi-card-premium">
                    <div className="kpi-label">Total Produzido (Mês)</div>
                    <div className="kpi-value">{(stats.totalProduced / 1000).toFixed(1)}t</div>
                    <div className="kpi-trend positive">
                        <TrendingUp size={14} /> +12% vs mês anterior
                    </div>
                </div>
                <div className="kpi-card-premium">
                    <div className="kpi-label">Rendimento Médio</div>
                    <div className="kpi-value">{stats.avgYield}%</div>
                    <div className="kpi-trend positive">
                        <TrendingUp size={14} /> +0.5% meta batida
                    </div>
                </div>
                <div className="kpi-card-premium">
                    <div className="kpi-label">Eficiência Operacional</div>
                    <div className="kpi-value">92.4%</div>
                    <div className="kpi-trend negative">
                        <TrendingDown size={14} /> -1.2% paradas técnicas
                    </div>
                </div>
                <div className="kpi-card-premium">
                    <div className="kpi-label">Custo Médio / Kg</div>
                    <div className="kpi-value">R$ 4.25</div>
                    <div className="kpi-trend positive">
                        <TrendingDown size={14} /> -R$ 0.15 otimização
                    </div>
                </div>
            </div>

            <div className="pcp-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '24px' }}>
                <div className="pcp-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} />
                            <h3>Evolução de Rendimento & Produção</h3>
                        </div>
                    </div>
                    <div className="chart-wrapper" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.yieldByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} domain={[70, 85]} tick={{ fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-soft)' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar yAxisId="left" dataKey="prod" name="Produção (kg)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="yield" name="Rendimento (%)" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--success)' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="pcp-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PieChartIcon size={18} />
                            <h3>Produção por Turno</h3>
                        </div>
                    </div>
                    <div className="chart-wrapper" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.productionByShift}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.productionByShift.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="pcp-panel" style={{ marginTop: '24px' }}>
                <div className="panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Beef size={18} />
                        <h3>Top Cortes Produzidos</h3>
                    </div>
                </div>
                <div className="chart-wrapper" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={stats.topProducts}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fill: 'var(--text-muted)' }} />
                            <Tooltip />
                            <Bar dataKey="weight" name="Peso Total (kg)" fill="var(--primary-soft)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default PcpReports;
