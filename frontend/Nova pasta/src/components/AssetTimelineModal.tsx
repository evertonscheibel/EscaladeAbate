import React, { useState, useEffect } from 'react';
import { assetTimelineService } from '../services';
import { X, Calendar, User, Tag } from 'lucide-react';
import './TicketModal.css';

interface AssetTimelineModalProps {
    assetId: string;
    assetName: string;
    onClose: () => void;
}

const eventTypeColors: any = {
    aquisicao: '#10b981',
    alocacao: '#3b82f6',
    transferencia: '#f59e0b',
    manutencao: '#8b5cf6',
    atualizacao: '#06b6d4',
    baixa: '#ef4444',
    descarte: '#64748b',
    roubo_perda: '#dc2626',
    devolucao: '#14b8a6',
    upgrade: '#6366f1',
    incidente: '#f97316',
    mudanca: '#a855f7'
};

const eventTypeLabels: any = {
    aquisicao: 'Aquisição',
    alocacao: 'Alocação',
    transferencia: 'Transferência',
    manutencao: 'Manutenção',
    atualizacao: 'Atualização',
    baixa: 'Baixa',
    descarte: 'Descarte',
    roubo_perda: 'Roubo/Perda',
    devolucao: 'Devolução',
    upgrade: 'Upgrade',
    incidente: 'Incidente',
    mudanca: 'Mudança'
};

export const AssetTimelineModal: React.FC<AssetTimelineModalProps> = ({ assetId, assetName, onClose }) => {
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadTimeline();
    }, [assetId]);

    const loadTimeline = async () => {
        try {
            const response = await assetTimelineService.getByAsset(assetId);
            setTimeline(response.data);
        } catch (error) {
            console.error('Erro ao carregar timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTimeline = filter
        ? timeline.filter(event => event.eventType === filter)
        : timeline;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
                <div className="modal-header">
                    <div>
                        <h2>Histórico do Ativo</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{assetName}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Filtrar por tipo</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', width: '100%', fontSize: '14px' }}>
                            <option value="">Todos os eventos</option>
                            {Object.keys(eventTypeLabels).map(key => (
                                <option key={key} value={key}>{eventTypeLabels[key]}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner"></div>
                            <p>Carregando histórico...</p>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {/* Linha vertical da timeline */}
                            <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' }}></div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {filteredTimeline.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Nenhum evento encontrado</p>
                                ) : (
                                    filteredTimeline.map((event, index) => (
                                        <div key={event._id} style={{ position: 'relative', paddingLeft: '60px' }}>
                                            {/* Ponto na timeline */}
                                            <div style={{
                                                position: 'absolute',
                                                left: '11px',
                                                top: '8px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: eventTypeColors[event.eventType] || '#64748b',
                                                border: '3px solid white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                zIndex: 1
                                            }}></div>

                                            <div style={{
                                                background: 'white',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                    <div>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            background: eventTypeColors[event.eventType] || '#64748b',
                                                            color: 'white',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            marginBottom: '8px'
                                                        }}>
                                                            {eventTypeLabels[event.eventType] || event.eventType}
                                                        </span>
                                                        <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{event.title}</h3>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                                                        <Calendar size={14} />
                                                        {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                                                    </div>
                                                </div>

                                                <p style={{ margin: '0 0 12px 0', color: '#475569', lineHeight: '1.6' }}>{event.description}</p>

                                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                                                    {event.user && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                            <User size={14} />
                                                            <span>{event.user.name}</span>
                                                        </div>
                                                    )}
                                                    {event.itilCategory && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                            <Tag size={14} />
                                                            <span>ITIL: {event.itilCategory}</span>
                                                        </div>
                                                    )}
                                                    {event.cobitProcess && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                            <Tag size={14} />
                                                            <span>COBIT: {event.cobitProcess}</span>
                                                        </div>
                                                    )}
                                                    {event.cost > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: '600' }}>
                                                            <span>R$ {event.cost.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
