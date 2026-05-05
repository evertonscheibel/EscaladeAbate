import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, RefreshCw, Lock, Unlock,
    Plus, Edit2, Trash2, Send, Clock, Printer, GripVertical
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { preScheduleService } from '../services/preScheduleService';
import { SlaughterPreSchedule as ISlaughterPreSchedule, SlaughterPreLot } from '../types/slaughter';
import { v4 as uuidv4 } from 'uuid';
import { RancherAutocomplete } from '../components/RancherAutocomplete';
import { CreateRancherModal } from '../components/CreateRancherModal';
import { StandardFormModal } from '../components/StandardFormModal';
import './SlaughterSchedule.css';

interface SortableLotRowProps {
    lot: Partial<SlaughterPreLot>;
    index: number;
    isDraft: boolean;
    onEdit: (lot: Partial<SlaughterPreLot>, index: number) => void;
    onDelete: (index: number) => void;
}

const SortableLotRow: React.FC<SortableLotRowProps> = ({ lot, index, isDraft, onEdit, onDelete }) => {
    // Usar o UUID/ID local para o DnD
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: (lot as any).preLotRefId || index.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? 'var(--bg-secondary)' : undefined,
        zIndex: isDragging ? 1 : 0
    };

    return (
        <tr ref={setNodeRef} style={style}>
            <td className="num-col">
                <div {...attributes} {...listeners} className="drag-handle">
                    <GripVertical size={16} />
                </div>
                {index + 1}
            </td>
            <td>{lot.producerName}</td>
            <td className="num-col">{lot.brokerCode}</td>
            <td className="qty-col">{lot.boi}</td>
            <td className="qty-col">{lot.vaca}</td>
            <td className="qty-col">{lot.novilha}</td>
            <td className="qty-col">{lot.bubalino || 0}</td>
            <td className="qty-col">{lot.touro || 0}</td>
            <td className="total-col">{lot.total}</td>
            <td className="time-col">--:--</td>
            <td className="duration-col">--</td>
            <td className="time-col">--:--</td>
            <td className="actions-col">
                <button
                    className="btn-icon"
                    onClick={() => onEdit(lot, index)}
                    title="Editar"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    className="btn-icon danger"
                    onClick={() => onDelete(index)}
                    title="Excluir"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};


export const SlaughterSchedule: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState<ISlaughterPreSchedule | null>(null);
    const [localLots, setLocalLots] = useState<Partial<SlaughterPreLot>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const [editingLot, setEditingLot] = useState<Partial<SlaughterPreLot> | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showCreateRancher, setShowCreateRancher] = useState(false);
    const [newRancherName, setNewRancherName] = useState('');
    const [localStartTime, setLocalStartTime] = useState('');
    const [localRate, setLocalRate] = useState('');
    const [breakfastTime, setBreakfastTime] = useState('08:00');
    const [breakfastDuration, setBreakfastDuration] = useState('15');
    const [lunchTime, setLunchTime] = useState('11:00');
    const [lunchDuration, setLunchDuration] = useState('70');
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const initialNewLot: Partial<SlaughterPreLot> = {
        preLotRefId: '',
        producerName: '',
        municipio: '',
        uf: '',
        brokerCode: '',
        boi: 0,
        vaca: 0,
        novilha: 0,
        bubalino: 0,
        touro: 0,
        total: 0
    };
    const [newLot, setNewLot] = useState<Partial<SlaughterPreLot>>(initialNewLot);

    useEffect(() => {
        loadSchedule();
    }, [date]);

    // Auto-refresh a cada 60 segundos para manter dados atualizados
    useEffect(() => {
        refreshIntervalRef.current = setInterval(() => {
            if (date && !editingLot) {
                // Verificar se há alterações locais comparando com o que veio do servidor
                const hasLocalChanges = JSON.stringify(localLots) !== JSON.stringify(schedule?.lots);

                if (!hasLocalChanges) {
                    loadScheduleSilent();
                } else {
                    console.log('[DEBUG] Pulando auto-refresh devido a alterações locais não salvas');
                }
            }
        }, 60000);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [date, editingLot, localLots, schedule]);

    const formatTime = (timeStr: string): string => {
        if (!timeStr) return '';

        // Remove caracteres não numéricos exceto :
        let clean = timeStr.replace(/[^\d:]/g, '');

        if (!clean.includes(':')) {
            // Se digitou apenas números, ex: 7 -> 07:00, 0730 -> 07:30
            if (clean.length === 1) clean = `0${clean}:00`;
            else if (clean.length === 2) clean = `${clean}:00`;
            else if (clean.length === 3) clean = `0${clean[0]}:${clean.slice(1)}`;
            else if (clean.length === 4) clean = `${clean.slice(0, 2)}:${clean.slice(2)}`;
            else return clean; // Deixa o regex de validação pegar se for maior
        } else {
            // Se tem :, garantir 2 dígitos de cada lado
            let [hours, minutes] = clean.split(':');
            hours = hours.padStart(2, '0').slice(0, 2);
            minutes = minutes.padEnd(2, '0').slice(0, 2);
            clean = `${hours}:${minutes}`;
        }

        return clean;
    };

    const loadSchedule = async () => {
        if (!date) return;

        setLoading(true);
        setConnectionError(false);
        try {
            const data = await preScheduleService.getScheduleByDate(date);
            setSchedule(data.data);
            setLocalLots(data.data.lots || []);
            setLocalStartTime((data.data.startTime || '07:00').slice(0, 5));
            setLocalRate(data.data.rateHeadsPerHour?.toString() || '100');
            setBreakfastTime((data.data.breakfastTime || '08:00').slice(0, 5));
            setBreakfastDuration(data.data.breakfastDuration?.toString() || '15');
            setLunchTime((data.data.lunchTime || '11:00').slice(0, 5));
            setLunchDuration(data.data.lunchDuration?.toString() || '70');
        } catch (error: any) {
            console.error('Erro ao carregar escala:', error);
            if (!error.response) {
                setConnectionError(true);
            } else if (error.response.status === 404) {
                // Silencioso se não existir, o DRAFT virá no próximo request ou manual
            } else {
                alert('Erro ao carregar escala');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadScheduleSilent = async () => {
        if (!date || editingLot) return; // Não atualizar se estiver editando

        try {
            const data = await preScheduleService.getScheduleByDate(date);
            // Só atualizar se o status for ENVIADA ou PUBLISHED, para não sobrescrever DRAFT local do usuário
            if (data.data.status !== 'DRAFT') {
                setSchedule(data.data);
                setLocalLots(data.data.lots || []);
                setLocalStartTime((data.data.startTime || '07:00').slice(0, 5));
                setLocalRate(data.data.rateHeadsPerHour?.toString() || '100');
                setBreakfastTime((data.data.breakfastTime || '08:00').slice(0, 5));
                setBreakfastDuration(data.data.breakfastDuration?.toString() || '15');
                setLunchTime((data.data.lunchTime || '11:00').slice(0, 5));
                setLunchDuration(data.data.lunchDuration?.toString() || '70');
            }
        } catch (error: any) {
            console.error('Erro no auto-refresh:', error);
        }
    };

    const handleUpdateStartTime = (newTime: string) => {
        setLocalStartTime(newTime);
    };

    const handleUpdateRate = (newRateStr: string) => {
        setLocalRate(newRateStr);
    };

    const handleSaveLot = (lotData: Partial<SlaughterPreLot>, isUpdate: boolean) => {
        if (!lotData.producerName || !lotData.brokerCode) {
            alert('Preencha os campos obrigatórios (Pecuarista e Corretor)');
            return;
        }

        const total = (lotData.boi || 0) + (lotData.vaca || 0) + (lotData.novilha || 0) + (lotData.bubalino || 0) + (lotData.touro || 0);
        if (total === 0) {
            alert('O total de cabeças deve ser maior que zero');
            return;
        }

        if (isUpdate && editingIndex !== null) {
            const updatedLots = [...localLots];
            updatedLots[editingIndex] = { ...lotData, total };
            setLocalLots(updatedLots);
            setEditingLot(null);
            setEditingIndex(null);
        } else {
            // New lot
            const newLotEntry: Partial<SlaughterPreLot> = {
                ...lotData,
                preLotRefId: uuidv4(),
                total
            };
            setLocalLots([...localLots, newLotEntry]);
            setNewLot(initialNewLot);
        }
    };

    const handleDeleteLot = (index: number) => {
        if (!confirm('Deseja realmente excluir este lote do rascunho?')) return;
        const updatedLots = localLots.filter((_, i) => i !== index);
        setLocalLots(updatedLots);
    };

    const handleBulkSend = async (status: 'DRAFT' | 'ENVIADA' = 'ENVIADA') => {
        if (!date || localLots.length === 0) {
            alert('Não há lotes para salvar.');
            return;
        }

        if (status === 'ENVIADA' && !confirm('Deseja realmente FECHAR esta pré-escala? Após fechar, ela ficará disponível para impressão e as edições serão bloqueadas.')) {
            return;
        }

        if (status === 'DRAFT' && schedule?.status === 'ENVIADA' && !confirm('Deseja REABRIR esta pré-escala para edição?')) {
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                date,
                startTime: (localStartTime || '').slice(0, 5),
                rateHeadsPerHour: parseInt(localRate) || 100,
                lots: localLots.map(l => ({
                    ...l,
                    preLotRefId: l.preLotRefId || uuidv4() // Garantir ID
                })),
                requestId: uuidv4(),
                breakfastTime: (breakfastTime || '').slice(0, 5),
                breakfastDuration: parseInt(breakfastDuration) || 0,
                lunchTime: (lunchTime || '').slice(0, 5),
                lunchDuration: parseInt(lunchDuration) || 0,
                status
            };

            console.log('[DEBUG] Salvando pré-escala para data:', date, 'Status:', status, 'Payload:', payload);
            const response = await preScheduleService.bulkSave(payload);
            console.log('[DEBUG] Resposta completa do bulkSave:', response);

            if (response.success && response.data) {
                setSchedule(response.data);
                setLocalLots(response.data.lots || []);
                alert(status === 'ENVIADA' ? 'Pré-escala FECHADA com sucesso!' : 'Rascunho salvo com sucesso!');
            } else {
                alert(response.message || 'Erro ao salvar pré-escala');
            }
        } catch (error: any) {
            console.error('[DEBUG] Erro catch handleBulkSend:', error);
            alert(error.response?.data?.message || 'Erro ao salvar pré-escala');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = localLots.findIndex(l => (l as any).preLotRefId === active.id);
            const newIndex = localLots.findIndex(l => (l as any).preLotRefId === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                setLocalLots(prev => arrayMove(prev, oldIndex, newIndex));
            }
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // PDF Download removido temporariamente para o modelo bulk (será adicionado quando implementado no backend)
    const handleDownloadPDF = () => {
        alert('Impressão de PDF será disponibilizada após a publicação da escala.');
    };

    const isDraft = schedule?.status === 'DRAFT' || !schedule;
    const isClosed = schedule?.status === 'ENVIADA' || schedule?.status === 'PUBLISHED';
    const dateFormatted = date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR') : '';

    const calculateTotals = () => {
        return localLots.reduce((acc, lot) => ({
            boi: (acc.boi || 0) + (lot.boi || 0),
            vaca: (acc.vaca || 0) + (lot.vaca || 0),
            novilha: (acc.novilha || 0) + (lot.novilha || 0),
            bubalino: (acc.bubalino || 0) + (lot.bubalino || 0),
            touro: (acc.touro || 0) + (lot.touro || 0),
            total: (acc.total || 0) + (lot.total || 0)
        }), { boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0, total: 0 } as any);
    };

    const totals = calculateTotals();

    const handlePrint = async () => {
        if (!schedule?._id) return;
        try {
            const response = await preScheduleService.exportPdf(schedule._id);
            if (response.success && response.pdfUrl) {
                // Remove /api do final da URL se estiver presente para acessar os arquivos estáticos na raiz
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                const finalUrl = `${baseUrl}${response.pdfUrl}`;
                console.log('[DEBUG] Abrindo PDF:', finalUrl);
                window.open(finalUrl, '_blank');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF da pré-escala');
        }
    };

    if (loading) return <div className="loading">Carregando dados da pré-escala...</div>;

    if (connectionError && !schedule) {
        return (
            <div className="error" style={{ textAlign: 'center', padding: '40px' }}>
                <h2 style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>⚠️ Servidor indisponível</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Não foi possível conectar ao servidor. Verifique se o backend está ativo.</p>
                <button className="btn-primary" onClick={loadSchedule} style={{ padding: '10px 24px', fontSize: '14px' }}>
                    <RefreshCw size={18} /> Tentar Novamente
                </button>
            </div>
        );
    }

    if (!schedule) {
        return <div className="error">Escala não encontrada</div>;
    }

    return (
        <div className="slaughter-schedule">
            {connectionError && schedule && (
                <div style={{
                    background: 'linear-gradient(135deg, #fef3cd, #fff3cd)',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <span style={{ color: '#856404', fontSize: '14px' }}>
                        ⚠️ Conexão com o servidor perdida. Os dados exibidos podem estar desatualizados.
                    </span>
                    <button
                        className="btn-secondary"
                        onClick={loadSchedule}
                        style={{ padding: '6px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                        <RefreshCw size={14} /> Reconectar
                    </button>
                </div>
            )}
            <div className="schedule-header">
                <div className="header-top">
                    <div className="header-left">
                        <button className="btn-back" onClick={() => navigate('/slaughter')}>
                            <ArrowLeft size={20} />
                            Voltar
                        </button>
                    </div>

                    <div className="header-title">
                        <h1>Pré Escala de Abate - {dateFormatted}</h1>
                    </div>

                    <div className="header-actions">
                        <div className={`status-badge ${(schedule?.status || 'DRAFT').toLowerCase()}`}>
                            {(!schedule || schedule.status === 'DRAFT') ? (
                                <><Edit2 size={16} /> Rascunho</>
                            ) : schedule.status === 'ENVIADA' ? (
                                <><Save size={16} /> Enviada</>
                            ) : (
                                <><Lock size={16} /> {schedule.status === 'PUBLISHED' ? 'Publicada' : 'Cancelada'}</>
                            )}
                        </div>
                    </div>
                </div>

                <div className="header-bottom">
                    <div className="header-info-inputs">
                        <div className="info-item">
                            <label>Hora de Início:</label>
                            <input
                                type="text"
                                value={localStartTime}
                                onChange={(e) => setLocalStartTime(e.target.value)}
                                onBlur={(e) => {
                                    const formatted = formatTime(e.target.value);
                                    setLocalStartTime(formatted);
                                    handleUpdateStartTime(formatted);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                className="header-time-input"
                                placeholder="07:00"
                                disabled={isClosed}
                            />
                        </div>

                        <div className="info-item">
                            <label>Taxa de Abate (cabs/h):</label>
                            <input
                                type="text"
                                value={localRate}
                                onChange={(e) => setLocalRate(e.target.value)}
                                onBlur={(e) => handleUpdateRate(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                className="header-rate-input"
                                disabled={isClosed}
                            />
                        </div>

                        <div className="info-item intervals-group">
                            <div className="interval-sub">
                                <label>Café:</label>
                                <div className="interval-inputs">
                                    <input
                                        type="text"
                                        value={breakfastTime}
                                        onChange={(e) => setBreakfastTime(e.target.value)}
                                        onBlur={(e) => setBreakfastTime(formatTime(e.target.value))}
                                        className="header-time-input-small"
                                        placeholder="08:00"
                                        disabled={isClosed}
                                    />
                                    <input
                                        type="number"
                                        value={breakfastDuration}
                                        onChange={(e) => setBreakfastDuration(e.target.value)}
                                        className="header-duration-input"
                                        placeholder="15"
                                        disabled={isClosed}
                                    />
                                    <span className="unit-label">min</span>
                                </div>
                            </div>

                            <div className="interval-sub">
                                <label>Almoço:</label>
                                <div className="interval-inputs">
                                    <input
                                        type="text"
                                        value={lunchTime}
                                        onChange={(e) => setLunchTime(e.target.value)}
                                        onBlur={(e) => setLunchTime(formatTime(e.target.value))}
                                        className="header-time-input-small"
                                        placeholder="11:00"
                                        disabled={isClosed}
                                    />
                                    <input
                                        type="number"
                                        value={lunchDuration}
                                        onChange={(e) => setLunchDuration(e.target.value)}
                                        className="header-duration-input"
                                        placeholder="70"
                                        disabled={isClosed}
                                    />
                                    <span className="unit-label">min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="schedule-content">
                <div className="totals-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Totais (Pré-Escala)</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {schedule?._id && (schedule.status === 'ENVIADA' || schedule.status === 'PUBLISHED') && (
                                <button
                                    className="btn-secondary"
                                    onClick={handlePrint}
                                    title="Imprimir PDF"
                                >
                                    <Printer size={18} />
                                    Imprimir PDF
                                </button>
                            )}
                            {isClosed ? (
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleBulkSend('DRAFT')}
                                    disabled={isSaving}
                                    style={{ padding: '8px 16px', color: '#dc3545', borderColor: '#dc3545' }}
                                >
                                    <Unlock size={18} />
                                    Reabrir Lote
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => handleBulkSend('DRAFT')}
                                        disabled={isSaving}
                                        style={{ padding: '8px 16px' }}
                                    >
                                        <Save size={18} />
                                        Salvar Rascunho
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleBulkSend('ENVIADA')}
                                        disabled={isSaving}
                                        style={{ padding: '8px 16px', backgroundColor: '#28a745' }}
                                    >
                                        {isSaving ? <Send className="animate-spin" size={18} /> : <Lock size={18} />}
                                        {isSaving ? 'Fechando...' : 'Fechar Lote'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="totals-grid">
                        <div className="total-item">
                            <span className="total-label">Boi:</span>
                            <span className="total-value">{totals.boi}</span>
                        </div>
                        <div className="total-item">
                            <span className="total-label">Vaca:</span>
                            <span className="total-value">{totals.vaca}</span>
                        </div>
                        <div className="total-item">
                            <span className="total-label">Novilha:</span>
                            <span className="total-value">{totals.novilha}</span>
                        </div>
                        <div className="total-item">
                            <span className="total-label">Bubalino:</span>
                            <span className="total-value">{totals.bubalino}</span>
                        </div>
                        <div className="total-item">
                            <span className="total-label">Touro:</span>
                            <span className="total-value">{totals.touro}</span>
                        </div>
                        <div className="total-item grand-total">
                            <span className="total-label">Total Geral:</span>
                            <span className="total-value">{totals.total}</span>
                        </div>
                    </div>
                </div>

                <div className="lots-section">
                    <div className="lots-header">
                        <h2>Pré Escala Diária</h2>
                    </div>

                    <div className="lots-table">
                        <table className="inline-edit-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }} className="num-col">Lote</th>
                                    <th style={{ width: '600px' }}>Pecuarista</th>
                                    <th style={{ width: '120px' }} className="num-col">Corretor</th>
                                    <th className="qty-col">Boi</th>
                                    <th className="qty-col">Vaca</th>
                                    <th className="qty-col">Novilha</th>
                                    <th className="qty-col">Bubalino</th>
                                    <th className="qty-col">Touro</th>
                                    <th className="total-col-header num-col">Total</th>
                                    <th className="num-col">Fim</th>
                                    <th className="num-col">Ações</th>
                                </tr>
                            </thead>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={localLots.map((l, i) => (l as any).preLotRefId || i.toString())}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody>
                                        {!isClosed && (
                                            <tr className="new-lot-row">
                                                <td className="num-col">
                                                    {localLots.length + 1}
                                                </td>
                                                <td>
                                                    <RancherAutocomplete
                                                        value={newLot.producerName || ''}
                                                        onChange={(name, id) => setNewLot({
                                                            ...newLot,
                                                            producerName: name
                                                        })}
                                                        onCreateNew={(name) => {
                                                            setNewRancherName(name);
                                                            setShowCreateRancher(true);
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={newLot.brokerCode || ''}
                                                        onChange={(e) => setNewLot({ ...newLot, brokerCode: e.target.value })}
                                                        className="inline-input-num"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={newLot.boi || 0}
                                                        onChange={(e) => setNewLot({ ...newLot, boi: parseInt(e.target.value) || 0 })}
                                                        className="inline-input-small"
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={newLot.vaca || 0}
                                                        onChange={(e) => setNewLot({ ...newLot, vaca: parseInt(e.target.value) || 0 })}
                                                        className="inline-input-small"
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={newLot.novilha || 0}
                                                        onChange={(e) => setNewLot({ ...newLot, novilha: parseInt(e.target.value) || 0 })}
                                                        className="inline-input-small"
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={newLot.bubalino || 0}
                                                        onChange={(e) => setNewLot({ ...newLot, bubalino: parseInt(e.target.value) || 0 })}
                                                        className="inline-input-small"
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={newLot.touro || 0}
                                                        onChange={(e) => setNewLot({ ...newLot, touro: parseInt(e.target.value) || 0 })}
                                                        className="inline-input-small"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="total-col">
                                                    {(newLot.boi || 0) + (newLot.vaca || 0) + (newLot.novilha || 0) + (newLot.bubalino || 0) + (newLot.touro || 0)}
                                                </td>
                                                <td colSpan={2} className="info-col">Clique no botão +</td>
                                                <td className="actions-col">
                                                    <button
                                                        className="btn-add-inline"
                                                        onClick={() => handleSaveLot(newLot, false)}
                                                        title="Adicionar Lote"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}

                                        {localLots.map((lot, idx) => (
                                            <SortableLotRow
                                                key={(lot as any).preLotRefId || idx}
                                                lot={lot}
                                                index={idx}
                                                isDraft={isDraft}
                                                onEdit={!isClosed ? (data, i) => {
                                                    setEditingLot(data);
                                                    setEditingIndex(i);
                                                } : () => alert('Abra o lote para editar')}
                                                onDelete={!isClosed ? handleDeleteLot : () => alert('Abra o lote para excluir')}
                                            />
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </DndContext>
                        </table>
                    </div>
                </div>
            </div>


            {/* Modal para Edição apenas */}
            <StandardFormModal
                isOpen={!!editingLot}
                onClose={() => setEditingLot(null)}
                title="Editar Lote"
                icon={<Edit2 size={20} />}
                size="lg"
                footer={
                    <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setEditingLot(null)}>
                            Cancelar
                        </button>
                        <button className="btn-primary" onClick={() => editingLot && handleSaveLot(editingLot, true)}>
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>
                }
            >
                {editingLot && (
                    <div className="form-grid">
                        <div className="form-group lot-number-field">
                            <label>Nº do Lote</label>
                            <input
                                type="number"
                                value={(editingIndex !== null ? editingIndex + 1 : '')}
                                disabled
                                className="disabled-input"
                            />
                        </div>

                        <div className="form-group rancher-field-group">
                            <label>Pecuarista *</label>
                            <RancherAutocomplete
                                value={editingLot.producerName || ''}
                                onChange={(name, id) => setEditingLot({
                                    ...editingLot,
                                    producerName: name
                                })}
                                onCreateNew={(name) => {
                                    setNewRancherName(name);
                                    setShowCreateRancher(true);
                                }}
                            />
                        </div>

                        <div className="form-group broker-field-group">
                            <label>Corretor *</label>
                            <input
                                type="text"
                                value={editingLot.brokerCode || ''}
                                onChange={(e) => setEditingLot({
                                    ...editingLot,
                                    brokerCode: e.target.value
                                })}
                            />
                        </div>

                        <div className="animal-counts-group">
                            <div className="form-group">
                                <label>Boi</label>
                                <input
                                    type="number"
                                    value={editingLot.boi || 0}
                                    onChange={(e) => setEditingLot({
                                        ...editingLot,
                                        boi: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Vaca</label>
                                <input
                                    type="number"
                                    value={editingLot.vaca || 0}
                                    onChange={(e) => setEditingLot({
                                        ...editingLot,
                                        vaca: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Novilha</label>
                                <input
                                    type="number"
                                    value={editingLot.novilha || 0}
                                    onChange={(e) => setEditingLot({
                                        ...editingLot,
                                        novilha: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Bubalino</label>
                                <input
                                    type="number"
                                    value={editingLot.bubalino || 0}
                                    onChange={(e) => setEditingLot({
                                        ...editingLot,
                                        bubalino: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Touro</label>
                                <input
                                    type="number"
                                    value={editingLot.touro || 0}
                                    onChange={(e) => setEditingLot({
                                        ...editingLot,
                                        touro: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </StandardFormModal>

            {showCreateRancher && (
                <CreateRancherModal
                    initialName={newRancherName}
                    onClose={() => setShowCreateRancher(false)}
                    onCreated={(rancher) => {
                        if (editingLot) {
                            setEditingLot({
                                ...editingLot,
                                producerName: rancher.name
                            });
                        } else {
                            setNewLot({
                                ...newLot,
                                producerName: rancher.name
                            });
                        }
                        setShowCreateRancher(false);
                    }}
                />
            )}
        </div>
    );
};
