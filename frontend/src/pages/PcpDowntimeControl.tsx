import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Edit2, Trash2, AlertTriangle, Clock, BarChart3,
    Settings, Search, Filter, X, Wrench, Shield, Users, Package, Zap, Truck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import api from '../services/api';

const CATEGORIAS = [
    { value: 'MANUTENCAO', label: 'Manutenção', icon: Wrench, color: '#ef4444' },
    { value: 'QUALIDADE', label: 'Qualidade', icon: Shield, color: '#f59e0b' },
    { value: 'MP', label: 'Matéria-Prima', icon: Package, color: '#8b5cf6' },
    { value: 'PESSOAS', label: 'Pessoas', icon: Users, color: '#3b82f6' },
    { value: 'SETUP', label: 'Setup', icon: Settings, color: '#06b6d4' },
    { value: 'LIMPEZA', label: 'Limpeza', icon: Zap, color: '#10b981' },
    { value: 'LOGISTICA', label: 'Logística', icon: Truck, color: '#ec4899' },
    { value: 'OUTROS', label: 'Outros', icon: AlertTriangle, color: '#94a3b8' }
];

const COLORS = CATEGORIAS.map(c => c.color);

const PcpDowntimeControl: React.FC = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'MOTIVOS' | 'ANALISE'>('MOTIVOS');
    const [motivos, setMotivos] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMotivo, setEditingMotivo] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        categoria: 'MANUTENCAO',
        improdutivo: true,
        exigeObservacao: false,
        abreTicket: false
    });

    useEffect(() => {
        fetchMotivos();
        fetchAnalysis();
    }, []);

    const fetchMotivos = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/pcp-downtime/motivos');
            setMotivos(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalysis = async () => {
        try {
            const { data } = await api.get('/pcp-downtime/analysis');
            setAnalysis(data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenModal = (motivo?: any) => {
        if (motivo) {
            setEditingMotivo(motivo);
            setFormData({
                nome: motivo.nome,
                categoria: motivo.categoria,
                improdutivo: motivo.improdutivo,
                exigeObservacao: motivo.exigeObservacao,
                abreTicket: motivo.abreTicket
            });
        } else {
            setEditingMotivo(null);
            setFormData({ nome: '', categoria: 'MANUTENCAO', improdutivo: true, exigeObservacao: false, abreTicket: false });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMotivo) {
                await api.put(`/pcp-downtime/motivos/${editingMotivo._id}`, formData);
                alert('Motivo atualizado');
            } else {
                await api.post('/pcp-downtime/motivos', formData);
                alert('Motivo cadastrado');
            }
            setShowModal(false);
            fetchMotivos();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Remover este motivo de parada?')) return;
        try {
            await api.delete(`/pcp-downtime/motivos/${id}`);
            fetchMotivos();
        } catch (e) {
            alert('Erro ao remover');
        }
    };

    const filteredMotivos = motivos.filter(m =>
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoriaInfo = (cat: string) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[CATEGORIAS.length - 1];

    return (
        <div className="page-container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn-icon tertiary" onClick={() => navigate('/pcp/day/' + new Date().toISOString().split('T')[0])}>
                            <ArrowLeft />
                        </button>
                        <div>
                            <h1 className="page-title">Controle de Paradas</h1>
                            <p className="page-subtitle">Gerencie motivos de parada e analise tempos improdutivos</p>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    {tab === 'MOTIVOS' && (
                        <button className="btn-primary" onClick={() => handleOpenModal()}>
                            <Plus size={18} /> Novo Motivo
                        </button>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="deb-new-tabs" style={{ marginTop: '16px' }}>
                <button className={`deb-new-tab ${tab === 'MOTIVOS' ? 'active' : ''}`} onClick={() => setTab('MOTIVOS')}>
                    <Settings size={16} /> Motivos de Parada
                </button>
                <button className={`deb-new-tab ${tab === 'ANALISE' ? 'active' : ''}`} onClick={() => setTab('ANALISE')}>
                    <BarChart3 size={16} /> Análise (Pareto)
                </button>
            </div>

            {tab === 'MOTIVOS' && (
                <div className="content-card" style={{ marginTop: '20px' }}>
                    <div className="filter-bar" style={{ marginBottom: '20px', padding: '16px 24px' }}>
                        <div className="search-input">
                            <Search size={18} />
                            <input type="text" placeholder="Buscar motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">Carregando motivos...</div>
                    ) : (
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Motivo</th>
                                    <th>Categoria</th>
                                    <th>Improdutivo?</th>
                                    <th>Requer Obs?</th>
                                    <th>Abre Ticket?</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMotivos.map(m => {
                                    const catInfo = getCategoriaInfo(m.categoria);
                                    const CatIcon = catInfo.icon;
                                    return (
                                        <tr key={m._id}>
                                            <td style={{ fontWeight: 700 }}>{m.nome}</td>
                                            <td>
                                                <span className="status-badge-premium" style={{ background: catInfo.color + '20', color: catInfo.color, border: `1px solid ${catInfo.color}40` }}>
                                                    <CatIcon size={12} /> {catInfo.label}
                                                </span>
                                            </td>
                                            <td>{m.improdutivo ? '✓ Sim' : '✗ Não'}</td>
                                            <td>{m.exigeObservacao ? '✓ Sim' : '✗ Não'}</td>
                                            <td>{m.abreTicket ? '✓ Auto' : '—'}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="action-btn edit" onClick={() => handleOpenModal(m)}><Edit2 size={16} /></button>
                                                    <button className="action-btn delete" onClick={() => handleDelete(m._id)}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'ANALISE' && (
                <div style={{ marginTop: '20px' }}>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                        <div className="content-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total de Eventos</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{analysis?.totalEvents || 0}</div>
                        </div>
                        <div className="content-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Tempo Parado Total</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{analysis?.totalDowntimeMin || 0} <span style={{ fontSize: '1rem' }}>min</span></div>
                        </div>
                        <div className="content-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Categorias Afetadas</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{analysis?.categoryData?.length || 0}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                        {/* Pareto de Motivos */}
                        <div className="content-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                <BarChart3 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                Pareto — Top Motivos de Parada
                            </h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart layout="vertical" data={(analysis?.paretoData || []).slice(0, 8)}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                        <YAxis dataKey="name" type="category" width={130} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }} />
                                        <Bar dataKey="totalMin" name="Tempo (min)" radius={[0, 4, 4, 0]}>
                                            {(analysis?.paretoData || []).slice(0, 8).map((_: any, i: number) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Paradas por Categoria */}
                        <div className="content-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                Distribuição por Categoria
                            </h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={analysis?.categoryData || []} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="totalMin" nameKey="name">
                                            {(analysis?.categoryData || []).map((_: any, i: number) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2>{editingMotivo ? 'Editar Motivo' : 'Novo Motivo de Parada'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Nome do Motivo</label>
                                        <input type="text" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Troca de lâminas" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Categoria</label>
                                        <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                                            {CATEGORIAS.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" checked={formData.improdutivo} onChange={(e) => setFormData({ ...formData, improdutivo: e.target.checked })} id="improdutivo" />
                                        <label htmlFor="improdutivo" style={{ margin: 0, cursor: 'pointer' }}>Tempo Improdutivo</label>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" checked={formData.exigeObservacao} onChange={(e) => setFormData({ ...formData, exigeObservacao: e.target.checked })} id="exigeObs" />
                                        <label htmlFor="exigeObs" style={{ margin: 0, cursor: 'pointer' }}>Requer Observação</label>
                                    </div>
                                    <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" checked={formData.abreTicket} onChange={(e) => setFormData({ ...formData, abreTicket: e.target.checked })} id="abreTicket" />
                                        <label htmlFor="abreTicket" style={{ margin: 0, cursor: 'pointer' }}>Abre Ticket Automático</label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PcpDowntimeControl;
