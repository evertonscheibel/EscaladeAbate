import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Edit2, Trash2, Thermometer, Box,
    SnowflakeIcon, AlertTriangle, CheckCircle, X, Settings
} from 'lucide-react';
import api from '../services/api';

const TIPOS = [
    { value: 'RESFRIAMENTO', label: 'Resfriamento', color: '#3b82f6' },
    { value: 'CONGELAMENTO', label: 'Congelamento', color: '#06b6d4' },
    { value: 'MATURACAO', label: 'Maturação', color: '#8b5cf6' },
    { value: 'ESPERA', label: 'Espera', color: '#f59e0b' }
];

const PcpColdRoomMap: React.FC = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showReadingModal, setShowReadingModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);

    const [formData, setFormData] = useState({
        nome: '',
        codigo: '',
        capacidadeKg: 0,
        temperaturaMin: -2,
        temperaturaMax: 4,
        tipo: 'RESFRIAMENTO',
        observacoes: ''
    });

    const [readingData, setReadingData] = useState({
        temperatura: 0,
        ocupacaoAtualKg: 0
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/cold-rooms');
            setRooms(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (room?: any) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                nome: room.nome,
                codigo: room.codigo || '',
                capacidadeKg: room.capacidadeKg,
                temperaturaMin: room.temperaturaMin,
                temperaturaMax: room.temperaturaMax,
                tipo: room.tipo,
                observacoes: room.observacoes || ''
            });
        } else {
            setEditingRoom(null);
            setFormData({ nome: '', codigo: '', capacidadeKg: 0, temperaturaMin: -2, temperaturaMax: 4, tipo: 'RESFRIAMENTO', observacoes: '' });
        }
        setShowModal(true);
    };

    const handleOpenReading = (room: any) => {
        setSelectedRoom(room);
        setReadingData({
            temperatura: room.temperaturaAtual || 0,
            ocupacaoAtualKg: room.ocupacaoAtualKg || 0
        });
        setShowReadingModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await api.put(`/cold-rooms/${editingRoom._id}`, formData);
                alert('Câmara atualizada');
            } else {
                await api.post('/cold-rooms', formData);
                alert('Câmara cadastrada');
            }
            setShowModal(false);
            fetchRooms();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar');
        }
    };

    const handleSubmitReading = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/cold-rooms/${selectedRoom._id}/reading`, readingData);
            alert('Leitura registrada');
            setShowReadingModal(false);
            fetchRooms();
        } catch (e) {
            alert('Erro ao registrar leitura');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Remover esta câmara?')) return;
        try {
            await api.delete(`/cold-rooms/${id}`);
            fetchRooms();
        } catch (e) {
            alert('Erro ao remover');
        }
    };

    const getTempStatus = (room: any) => {
        if (!room.temperaturaAtual && room.temperaturaAtual !== 0) return 'unknown';
        if (room.temperaturaAtual < room.temperaturaMin || room.temperaturaAtual > room.temperaturaMax) return 'danger';
        const margin = (room.temperaturaMax - room.temperaturaMin) * 0.2;
        if (room.temperaturaAtual < room.temperaturaMin + margin || room.temperaturaAtual > room.temperaturaMax - margin) return 'warning';
        return 'ok';
    };

    const getOcupacao = (room: any) => {
        if (!room.capacidadeKg || room.capacidadeKg === 0) return 0;
        return Math.round((room.ocupacaoAtualKg / room.capacidadeKg) * 100);
    };

    const getTipoInfo = (tipo: string) => TIPOS.find(t => t.value === tipo) || TIPOS[0];

    return (
        <div className="page-container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn-icon tertiary" onClick={() => navigate('/pcp/day/' + new Date().toISOString().split('T')[0])}>
                            <ArrowLeft />
                        </button>
                        <div>
                            <h1 className="page-title">Mapa de Câmaras Frias</h1>
                            <p className="page-subtitle">Monitoramento de temperatura e ocupação das câmaras</p>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Nova Câmara
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Carregando câmaras...</div>
            ) : rooms.length === 0 ? (
                <div className="content-card" style={{ padding: '60px', textAlign: 'center', marginTop: '24px' }}>
                    <SnowflakeIcon size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: 'var(--text-muted)' }}>Nenhuma Câmara Cadastrada</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Clique em "Nova Câmara" para começar</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    marginTop: '24px'
                }}>
                    {rooms.map(room => {
                        const tempStatus = getTempStatus(room);
                        const ocupPct = getOcupacao(room);
                        const tipoInfo = getTipoInfo(room.tipo);

                        return (
                            <div key={room._id} className="content-card" style={{
                                padding: 0,
                                overflow: 'hidden',
                                border: tempStatus === 'danger' ? '2px solid #ef4444' : tempStatus === 'warning' ? '2px solid #f59e0b' : '1px solid var(--border)',
                                transition: 'all 0.3s'
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '16px 20px',
                                    background: tempStatus === 'danger' ? 'rgba(239, 68, 68, 0.08)' : tempStatus === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-soft)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <SnowflakeIcon size={18} color={tipoInfo.color} />
                                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{room.nome}</span>
                                        </div>
                                        {room.codigo && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.codigo}</span>}
                                    </div>
                                    <span className="status-badge-premium" style={{ background: tipoInfo.color + '20', color: tipoInfo.color, border: `1px solid ${tipoInfo.color}40`, fontSize: '0.65rem' }}>
                                        {tipoInfo.label}
                                    </span>
                                </div>

                                {/* Temperature */}
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <Thermometer size={28} color={tempStatus === 'danger' ? '#ef4444' : tempStatus === 'warning' ? '#f59e0b' : '#3b82f6'} />
                                    <div style={{
                                        fontSize: '2.5rem',
                                        fontWeight: 800,
                                        color: tempStatus === 'danger' ? '#ef4444' : tempStatus === 'warning' ? '#f59e0b' : 'var(--text)',
                                        lineHeight: 1.2,
                                        marginTop: '4px'
                                    }}>
                                        {room.temperaturaAtual != null ? `${room.temperaturaAtual.toFixed(1)}°C` : '--°C'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Faixa: {room.temperaturaMin}°C a {room.temperaturaMax}°C
                                    </div>
                                    {tempStatus === 'danger' && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>
                                            <AlertTriangle size={14} /> TEMPERATURA FORA DA FAIXA
                                        </div>
                                    )}
                                </div>

                                {/* Ocupacao */}
                                <div style={{ padding: '0 20px 16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        <span>Ocupação</span>
                                        <span style={{ fontWeight: 700 }}>{ocupPct}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(ocupPct, 100)}%`,
                                            height: '100%',
                                            background: ocupPct > 90 ? '#ef4444' : ocupPct > 70 ? '#f59e0b' : '#10b981',
                                            borderRadius: '4px',
                                            transition: 'width 0.5s'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {(room.ocupacaoAtualKg || 0).toLocaleString('pt-BR')} / {(room.capacidadeKg || 0).toLocaleString('pt-BR')} kg
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{
                                    padding: '12px 20px',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex',
                                    gap: '8px',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleOpenReading(room)}>
                                        <Thermometer size={14} /> Registrar Leitura
                                    </button>
                                    <button className="action-btn edit" onClick={() => handleOpenModal(room)}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(room._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Create/Edit Room */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2>{editingRoom ? 'Editar Câmara' : 'Nova Câmara Fria'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nome da Câmara</label>
                                        <input type="text" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Câmara 01" />
                                    </div>
                                    <div className="form-group">
                                        <label>Código</label>
                                        <input type="text" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ex: CF-01" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo</label>
                                        <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                                            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Capacidade (Kg)</label>
                                        <input type="number" required min={0} value={formData.capacidadeKg} onChange={(e) => setFormData({ ...formData, capacidadeKg: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Temp. Mínima (°C)</label>
                                        <input type="number" step="0.1" value={formData.temperaturaMin} onChange={(e) => setFormData({ ...formData, temperaturaMin: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Temp. Máxima (°C)</label>
                                        <input type="number" step="0.1" value={formData.temperaturaMax} onChange={(e) => setFormData({ ...formData, temperaturaMax: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Observações</label>
                                        <textarea rows={2} value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
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

            {/* Modal: Temperature Reading */}
            {showReadingModal && selectedRoom && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2>Registrar Leitura — {selectedRoom.nome}</h2>
                            <button className="close-btn" onClick={() => setShowReadingModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmitReading}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Temperatura Atual (°C)</label>
                                        <input type="number" step="0.1" required value={readingData.temperatura} onChange={(e) => setReadingData({ ...readingData, temperatura: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Ocupação Atual (Kg)</label>
                                        <input type="number" min={0} value={readingData.ocupacaoAtualKg} onChange={(e) => setReadingData({ ...readingData, ocupacaoAtualKg: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowReadingModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PcpColdRoomMap;
