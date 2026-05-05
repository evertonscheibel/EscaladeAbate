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
            <header className="pcp-header">
                <div className="header-left">
                    <button className="deb-new-btn-icon" onClick={() => navigate('/pcp')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="header-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 color="var(--primary)" size={32} />
                            <h1>Relatórios PCP & Performance</h1>
                        </div>
                        <p>Análise de rendimento, produtividade e custos operacionais.</p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="date-filter-group" style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '12px' }}>
                        <input
                            type="date"
                            className="deb-new-input"
                            style={{ width: '150px' }}
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span style={{ display: 'flex', alignItems: 'center' }}>até</span>
                        <input
                            type="date"
                            className="deb-new-input"
                            style={{ width: '150px' }}
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button className="deb-new-btn-outline">
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </header>

            <div className="pcp-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div className="deb-new-card stat-card-premium">
                    <div className="stat-label">Total Produzido (Mês)</div>
                    <div className="stat-value">{(stats.totalProduced / 1000).toFixed(1)}t</div>
                    <div className="stat-trend positive">
                        <TrendingUp size={16} /> +12% vs mês anterior
                    </div>
                </div>
                <div className="deb-new-card stat-card-premium">
                    <div className="stat-label">Rendimento Médio</div>
                    <div className="stat-value">{stats.avgYield}%</div>
                    <div className="stat-trend positive">
                        <TrendingUp size={16} /> +0.5% meta batida
                    </div>
                </div>
                <div className="deb-new-card stat-card-premium">
                    <div className="stat-label">Eficiência Operacional</div>
                    <div className="stat-value">92.4%</div>
                    <div className="stat-trend negative">
                        <TrendingDown size={16} /> -1.2% paradas técnicas
                    </div>
                </div>
                <div className="deb-new-card stat-card-premium">
                    <div className="stat-label">Custo Médio / Kg</div>
                    <div className="stat-value">R$ 4.25</div>
                    <div className="stat-trend positive">
                        <TrendingDown size={16} /> -R$ 0.15 otimização
                    </div>
                </div>
            </div>

            <div className="pcp-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="deb-new-card">
                    <div className="deb-new-card-header">
                        <div className="card-title-group">
                            <TrendingUp color="var(--primary)" size={20} />
                            <h3>Evolução de Rendimento & Produção</h3>
                        </div>
                    </div>
                    <div style={{ height: '350px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.yieldByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} domain={[70, 85]} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar yAxisId="left" dataKey="prod" name="Produção (kg)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="yield" name="Rendimento (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="deb-new-card">
                    <div className="deb-new-card-header">
                        <div className="card-title-group">
                            <PieChartIcon color="var(--primary)" size={20} />
                            <h3>Produção por Turno</h3>
                        </div>
                    </div>
                    <div style={{ height: '350px', marginTop: '20px' }}>
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

            <div className="deb-new-card" style={{ marginTop: '24px' }}>
                <div className="deb-new-card-header">
                    <div className="card-title-group">
                        <Beef color="var(--primary)" size={20} />
                        <h3>Top Cortes Produzidos</h3>
                    </div>
                </div>
                <div style={{ height: '300px', marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={stats.topProducts}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} />
                            <Tooltip />
                            <Bar dataKey="weight" name="Peso Total (kg)" fill="var(--primary-light)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default PcpReports;
