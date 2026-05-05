import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, RefreshCw, Lock, Unlock, Play, Download,
    Plus, Edit2, Trash2, Clock, GripVertical, Package, Weight,
    Import, BarChart3, Thermometer, AlertTriangle, Check, X
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
import { deboningService } from '../services/deboningService';
import {
    DeboningSchedule as IDeboningSchedule,
    DeboningLot,
    SlaughterAvailable,
    ProductionSummary
} from '../types/deboning';
import './DeboningSchedule.css';

// ── Sortable Row ─────────────────────────────────────────

interface SortableLotRowProps {
    lot: DeboningLot;
    canEdit: boolean;
    onEdit: (lot: DeboningLot) => void;
    onDelete: (id: string) => void;
    onProduction: (lot: DeboningLot) => void;
}

const SortableLotRow: React.FC<SortableLotRowProps> = ({ lot, canEdit, onEdit, onDelete, onProduction }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lot._id! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? 'var(--bg-secondary)' : undefined,
        zIndex: isDragging ? 1 : 0
    };

    const statusColors: Record<string, string> = {
        PENDENTE: '#f59e0b',
        EM_PROCESSO: '#3b82f6',
        CONCLUIDO: '#10b981'
    };

    const statusLabels: Record<string, string> = {
        PENDENTE: 'Pendente',
        EM_PROCESSO: 'Processando',
        CONCLUIDO: 'Concluído'
    };

    const destinoLabels: Record<string, string> = {
        MERCADO_INTERNO: 'MI',
        EXPORTACAO: 'EXP',
        MERCADO_INTERNO_EXPORTACAO: 'MI/EXP',
        INDUSTRIALIZACAO: 'IND'
    };

    return (
        <tr ref={setNodeRef} style={style} className={`lot-row ${lot.lotStatus?.toLowerCase().replace('_', '-')}`}>
            <td className="num-col">
                {canEdit && (
                    <div {...attributes} {...listeners} className="drag-handle">
                        <GripVertical size={16} />
                    </div>
                )}
                {lot.lotNumber}
            </td>
            <td>{lot.origin}</td>
            <td className="num-col">{lot.sifNumber || '-'}</td>
            <td className="qty-col">{lot.boi}</td>
            <td className="qty-col">{lot.vaca}</td>
            <td className="qty-col">{lot.novilha}</td>
            <td className="qty-col">{lot.bubalino || 0}</td>
            <td className="qty-col">{lot.touro || 0}</td>
            <td className="total-col">{lot.totalCarcassas}</td>
            <td className="dest-col">
                <span className={`destino-badge ${lot.destino?.toLowerCase().replace(/_/g, '-')}`}>
                    {destinoLabels[lot.destino] || 'MI'}
                </span>
            </td>
            <td className="time-col">{lot.startTime}</td>
            <td className="time-col">{lot.endTime}</td>
            <td className="kg-col">{lot.totalProduzidoKg > 0 ? lot.totalProduzidoKg.toLocaleString('pt-BR') : '-'}</td>
            <td className="status-col">
                <span className="lot-status-badge" style={{ backgroundColor: statusColors[lot.lotStatus] || '#9ca3af' }}>
                    {statusLabels[lot.lotStatus] || 'Pendente'}
                </span>
            </td>
            <td className="actions-col">
                <button className="btn-icon production" onClick={() => onProduction(lot)} title="Registrar Produção">
                    <Weight size={16} />
                </button>
                {canEdit && (
                    <>
                        <button className="btn-icon" onClick={() => onEdit(lot)} title="Editar">
                            <Edit2 size={16} />
                        </button>
                        <button className="btn-icon danger" onClick={() => onDelete(lot._id!)} title="Excluir">
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            </td>
        </tr>
    );
};

// ── Main Component ──────────────────────────────────────

export const DeboningSchedule: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState<IDeboningSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Modais
    const [showLotModal, setShowLotModal] = useState(false);
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [editingLot, setEditingLot] = useState<DeboningLot | null>(null);
    const [productionLot, setProductionLot] = useState<DeboningLot | null>(null);
    const [availableSlaughter, setAvailableSlaughter] = useState<SlaughterAvailable[]>([]);
    const [productionSummary, setProductionSummary] = useState<ProductionSummary | null>(null);

    // Form state - novo lote
    const [lotForm, setLotForm] = useState({
        origin: '', sifNumber: '', boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0,
        destino: 'MERCADO_INTERNO', destinoDetalhe: '', pesoMedioCarcassa: 250, notes: ''
    });

    // Form state - produção
    const [prodForm, setProdForm] = useState({
        traseiro: 0, dianteiro: 0, pontaAgulha: 0, recortes: 0,
        osso: 0, sebo: 0, miudos: 0, outros: 0, lotStatus: 'PENDENTE'
    });

    // Settings form
    const [settingsForm, setSettingsForm] = useState({
        startTime: '06:00', targetCarcassesPerHour: 50,
        breakfastTime: '08:00', breakfastDuration: 15,
        lunchTime: '11:00', lunchDuration: 60,
        chamberTemperature: 0, notes: ''
    });

    // DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (date) loadSchedule();
    }, [date]);

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const data = await deboningService.getScheduleByDate(date!);
            setSchedule(data);
            setSettingsForm({
                startTime: data.startTime || '06:00',
                targetCarcassesPerHour: data.targetCarcassesPerHour || 50,
                breakfastTime: data.breakfastTime || '08:00',
                breakfastDuration: data.breakfastDuration || 15,
                lunchTime: data.lunchTime || '11:00',
                lunchDuration: data.lunchDuration || 60,
                chamberTemperature: data.chamberTemperature || 0,
                notes: data.notes || ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao carregar programação');
        } finally {
            setLoading(false);
        }
    };

    const isDraft = schedule?.status === 'DRAFT';
    const isInProgress = schedule?.status === 'IN_PROGRESS';
    const isClosed = schedule?.status === 'CLOSED';
    const canEdit = isDraft || isInProgress;

    // ── Handlers ──────────────────────────────────────

    const handleSaveSettings = async () => {
        if (!schedule) return;
        setSaving(true);
        try {
            const updated = await deboningService.updateSchedule(schedule._id, settingsForm);
            setSchedule(prev => prev ? { ...prev, ...updated } : updated);
            if (updated.lots) setSchedule(prev => prev ? { ...prev, lots: updated.lots } : updated);
            setShowSettingsModal(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateLot = async () => {
        if (!schedule || !lotForm.origin.trim()) return;
        setSaving(true);
        try {
            const newLot = await deboningService.createLot(schedule._id, lotForm);
            setSchedule(prev => prev ? { ...prev, lots: [...(prev.lots || []), newLot] } : null);
            await loadSchedule();
            setShowLotModal(false);
            resetLotForm();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao criar lote');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateLot = async () => {
        if (!editingLot?._id) return;
        setSaving(true);
        try {
            await deboningService.updateLot(editingLot._id, lotForm);
            await loadSchedule();
            setShowLotModal(false);
            setEditingLot(null);
            resetLotForm();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao atualizar lote');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLot = async (lotId: string) => {
        if (!window.confirm('Excluir este lote?')) return;
        try {
            await deboningService.deleteLot(lotId);
            await loadSchedule();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir');
        }
    };

    const handleSaveProduction = async () => {
        if (!productionLot?._id) return;
        setSaving(true);
        try {
            const { lotStatus, ...production } = prodForm;
            await deboningService.updateLotProduction(productionLot._id, production, lotStatus);
            await loadSchedule();
            setShowProductionModal(false);
            setProductionLot(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao salvar produção');
        } finally {
            setSaving(false);
        }
    };

    const handleImportSlaughter = async (slaughterDate: string) => {
        if (!schedule) return;
        setSaving(true);
        try {
            await deboningService.importFromSlaughter(schedule._id, slaughterDate);
            await loadSchedule();
            setShowImportModal(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao importar');
        } finally {
            setSaving(false);
        }
    };

    const handleStart = async () => {
        if (!schedule || !window.confirm('Iniciar produção? Os lotes poderão receber registros de produção.')) return;
        try {
            await deboningService.start(schedule._id);
            await loadSchedule();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao iniciar');
        }
    };

    const handleClose = async () => {
        if (!schedule || !window.confirm('Fechar esta programação? Não será mais possível editar.')) return;
        try {
            await deboningService.close(schedule._id);
            await loadSchedule();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao fechar');
        }
    };

    const handleReopen = async () => {
        if (!schedule || !window.confirm('Reabrir programação?')) return;
        try {
            await deboningService.reopen(schedule._id);
            await loadSchedule();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao reabrir');
        }
    };

    const handleRecalculate = async () => {
        if (!schedule) return;
        try {
            await deboningService.recalculate(schedule._id);
            await loadSchedule();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao recalcular');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        if (!schedule) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const lots = schedule.lots || [];
        const oldIndex = lots.findIndex(l => l._id === active.id);
        const newIndex = lots.findIndex(l => l._id === over.id);

        const reordered = arrayMove(lots, oldIndex, newIndex);
        setSchedule(prev => prev ? { ...prev, lots: reordered } : null);

        try {
            await deboningService.reorder(schedule._id, reordered.map(l => l._id!));
            await loadSchedule();
        } catch (err) {
            await loadSchedule();
        }
    };

    const openImportModal = async () => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const data = await deboningService.getAvailableSlaughter(thirtyDaysAgo.toISOString().split('T')[0]);
            setAvailableSlaughter(data);
            setShowImportModal(true);
        } catch (err) {
            alert('Erro ao buscar escalas de abate');
        }
    };

    const openSummaryModal = async () => {
        if (!schedule) return;
        try {
            const data = await deboningService.getProductionSummary(schedule._id);
            setProductionSummary(data);
            setShowSummaryModal(true);
        } catch (err) {
            alert('Erro ao carregar resumo');
        }
    };

    const openEditLot = (lot: DeboningLot) => {
        setEditingLot(lot);
        setLotForm({
            origin: lot.origin, sifNumber: lot.sifNumber || '', boi: lot.boi, vaca: lot.vaca,
            novilha: lot.novilha, bubalino: lot.bubalino, touro: lot.touro,
            destino: lot.destino, destinoDetalhe: lot.destinoDetalhe || '',
            pesoMedioCarcassa: lot.pesoMedioCarcassa || 250, notes: lot.notes || ''
        });
        setShowLotModal(true);
    };

    const openProductionModal = (lot: DeboningLot) => {
        setProductionLot(lot);
        setProdForm({
            traseiro: lot.production?.traseiro || 0,
            dianteiro: lot.production?.dianteiro || 0,
            pontaAgulha: lot.production?.pontaAgulha || 0,
            recortes: lot.production?.recortes || 0,
            osso: lot.production?.osso || 0,
            sebo: lot.production?.sebo || 0,
            miudos: lot.production?.miudos || 0,
            outros: lot.production?.outros || 0,
            lotStatus: lot.lotStatus || 'PENDENTE'
        });
        setShowProductionModal(true);
    };

    const resetLotForm = () => {
        setLotForm({
            origin: '', sifNumber: '', boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0,
            destino: 'MERCADO_INTERNO', destinoDetalhe: '', pesoMedioCarcassa: 250, notes: ''
        });
        setEditingLot(null);
    };

    const prodTotal = prodForm.traseiro + prodForm.dianteiro + prodForm.pontaAgulha +
        prodForm.recortes + prodForm.osso + prodForm.sebo + prodForm.miudos + prodForm.outros;

    const formattedDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }) : '';

    const lots = schedule?.lots || [];

    // ── Render ──────────────────────────────────────────

    if (loading) return <div className="deboning-schedule"><div className="loading-center">Carregando...</div></div>;
    if (error) return <div className="deboning-schedule"><div className="error-center">{error}</div></div>;
    if (!schedule) return null;

    return (
        <div className="deboning-schedule">
            {/* Header */}
            <div className="schedule-header">
                <div className="header-content">
                    <button className="btn-back" onClick={() => navigate('/deboning')}>
                        <ArrowLeft size={16} /> Voltar ao Calendário
                    </button>
                    <div className="header-title">
                        <Package size={28} />
                        <div>
                            <h1>Programação de Desossa</h1>
                            <span className="header-date">{formattedDate}</span>
                        </div>
                        <span className={`status-badge ${schedule.status.toLowerCase().replace('_', '-')}`}>
                            {schedule.status === 'DRAFT' ? 'Rascunho' : schedule.status === 'IN_PROGRESS' ? 'Em Produção' : 'Fechada'}
                        </span>
                    </div>

                    {/* Resumo rápido */}
                    <div className="header-stats">
                        <div className="stat-item">
                            <span className="stat-label">Carcaças</span>
                            <span className="stat-value">{schedule.totalCarcassas}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Lotes</span>
                            <span className="stat-value">{lots.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Produção</span>
                            <span className="stat-value">{(schedule.totalProduzidoKg || 0).toLocaleString('pt-BR')} kg</span>
                        </div>
                        {schedule.chamberTemperature !== undefined && schedule.chamberTemperature !== 0 && (
                            <div className="stat-item">
                                <Thermometer size={14} />
                                <span className="stat-label">Câmara</span>
                                <span className="stat-value">{schedule.chamberTemperature}°C</span>
                            </div>
                        )}
                    </div>

                    {/* Barra de ações */}
                    <div className="header-actions">
                        {isDraft && (
                            <>
                                <button className="btn-action" onClick={() => { resetLotForm(); setShowLotModal(true); }}>
                                    <Plus size={16} /> Novo Lote
                                </button>
                                <button className="btn-action secondary" onClick={openImportModal}>
                                    <Import size={16} /> Importar do Abate
                                </button>
                                <button className="btn-action secondary" onClick={handleRecalculate}>
                                    <RefreshCw size={16} /> Recalcular
                                </button>
                                <button className="btn-action secondary" onClick={() => setShowSettingsModal(true)}>
                                    <Clock size={16} /> Config
                                </button>
                                {lots.length > 0 && (
                                    <button className="btn-action success" onClick={handleStart}>
                                        <Play size={16} /> Iniciar Produção
                                    </button>
                                )}
                            </>
                        )}
                        {isInProgress && (
                            <>
                                <button className="btn-action" onClick={() => { resetLotForm(); setShowLotModal(true); }}>
                                    <Plus size={16} /> Novo Lote
                                </button>
                                <button className="btn-action secondary" onClick={openSummaryModal}>
                                    <BarChart3 size={16} /> Resumo
                                </button>
                                <button className="btn-action warning" onClick={handleClose}>
                                    <Lock size={16} /> Fechar
                                </button>
                            </>
                        )}
                        {isClosed && (
                            <>
                                <button className="btn-action secondary" onClick={openSummaryModal}>
                                    <BarChart3 size={16} /> Resumo
                                </button>
                                <button className="btn-action warning" onClick={handleReopen}>
                                    <Unlock size={16} /> Reabrir
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabela de lotes */}
            <div className="schedule-body">
                <div className="lots-container">
                    {lots.length === 0 ? (
                        <div className="empty-state">
                            <Package size={48} />
                            <h3>Nenhum lote programado</h3>
                            <p>Adicione lotes manualmente ou importe da escala de abate.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <table className="lots-table">
                                    <thead>
                                        <tr>
                                            <th className="num-col">Nº</th>
                                            <th>Origem/Produtor</th>
                                            <th className="num-col">SIF/Corretor</th>
                                            <th className="qty-col">Boi</th>
                                            <th className="qty-col">Vaca</th>
                                            <th className="qty-col">Nov.</th>
                                            <th className="qty-col">Bub.</th>
                                            <th className="qty-col">Touro</th>
                                            <th className="total-col">Total</th>
                                            <th className="dest-col">Dest.</th>
                                            <th className="time-col">Início</th>
                                            <th className="time-col">Fim</th>
                                            <th className="kg-col">Prod. (kg)</th>
                                            <th className="status-col">Status</th>
                                            <th className="actions-col">Ações</th>
                                        </tr>
                                    </thead>
                                    <SortableContext items={lots.map(l => l._id!)} strategy={verticalListSortingStrategy}>
                                        <tbody>
                                            {lots.map(lot => (
                                                <SortableLotRow
                                                    key={lot._id}
                                                    lot={lot}
                                                    canEdit={canEdit}
                                                    onEdit={openEditLot}
                                                    onDelete={handleDeleteLot}
                                                    onProduction={openProductionModal}
                                                />
                                            ))}
                                        </tbody>
                                    </SortableContext>
                                    <tfoot>
                                        <tr className="totals-row">
                                            <td colSpan={3}><strong>TOTAIS</strong></td>
                                            <td className="qty-col"><strong>{schedule.totalBoi}</strong></td>
                                            <td className="qty-col"><strong>{schedule.totalVaca}</strong></td>
                                            <td className="qty-col"><strong>{schedule.totalNovilha}</strong></td>
                                            <td className="qty-col"><strong>{schedule.totalBubalino}</strong></td>
                                            <td className="qty-col"><strong>{schedule.totalTouro}</strong></td>
                                            <td className="total-col"><strong>{schedule.totalCarcassas}</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td className="kg-col"><strong>{(schedule.totalProduzidoKg || 0).toLocaleString('pt-BR')}</strong></td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </DndContext>
                        </div>
                    )}
                </div>

                {/* Info do abate vinculado */}
                {schedule.slaughterSchedule && (
                    <div className="slaughter-link-info">
                        <span>Vinculado ao abate de {new Date(schedule.slaughterSchedule.slaughterDate).toLocaleDateString('pt-BR')}</span>
                        <span className="slaughter-total">{schedule.slaughterSchedule.totalCattle} cabeças abatidas</span>
                    </div>
                )}
            </div>

            {/* ── Modal: Novo/Editar Lote ────────────────────────── */}
            {showLotModal && (
                <div className="modal-overlay" onClick={() => { setShowLotModal(false); resetLotForm(); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingLot ? 'Editar Lote' : 'Novo Lote'}</h2>
                            <button className="btn-close" onClick={() => { setShowLotModal(false); resetLotForm(); }}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label>Origem / Produtor *</label>
                                    <input type="text" value={lotForm.origin} onChange={e => setLotForm({ ...lotForm, origin: e.target.value })} placeholder="Nome do produtor ou origem" />
                                </div>
                                <div className="form-group">
                                    <label>SIF / Corretor</label>
                                    <input type="text" value={lotForm.sifNumber} onChange={e => setLotForm({ ...lotForm, sifNumber: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row quantities">
                                <div className="form-group">
                                    <label>Boi</label>
                                    <input type="number" min="0" value={lotForm.boi} onChange={e => setLotForm({ ...lotForm, boi: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Vaca</label>
                                    <input type="number" min="0" value={lotForm.vaca} onChange={e => setLotForm({ ...lotForm, vaca: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Novilha</label>
                                    <input type="number" min="0" value={lotForm.novilha} onChange={e => setLotForm({ ...lotForm, novilha: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Bubalino</label>
                                    <input type="number" min="0" value={lotForm.bubalino} onChange={e => setLotForm({ ...lotForm, bubalino: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Touro</label>
                                    <input type="number" min="0" value={lotForm.touro} onChange={e => setLotForm({ ...lotForm, touro: +e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Destino</label>
                                    <select value={lotForm.destino} onChange={e => setLotForm({ ...lotForm, destino: e.target.value })}>
                                        <option value="MERCADO_INTERNO">Mercado Interno</option>
                                        <option value="EXPORTACAO">Exportação</option>
                                        <option value="MERCADO_INTERNO_EXPORTACAO">MI + Exportação</option>
                                        <option value="INDUSTRIALIZACAO">Industrialização</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Detalhe do Destino</label>
                                    <input type="text" value={lotForm.destinoDetalhe} onChange={e => setLotForm({ ...lotForm, destinoDetalhe: e.target.value })} placeholder="Ex: China, EUA, Atacadão..." />
                                </div>
                                <div className="form-group">
                                    <label>Peso Médio (kg)</label>
                                    <input type="number" min="50" value={lotForm.pesoMedioCarcassa} onChange={e => setLotForm({ ...lotForm, pesoMedioCarcassa: +e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea value={lotForm.notes} onChange={e => setLotForm({ ...lotForm, notes: e.target.value })} rows={2} />
                            </div>

                            <div className="lot-total-preview">
                                Total de carcaças: <strong>{lotForm.boi + lotForm.vaca + lotForm.novilha + lotForm.bubalino + lotForm.touro}</strong>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => { setShowLotModal(false); resetLotForm(); }}>Cancelar</button>
                            <button className="btn-save" onClick={editingLot ? handleUpdateLot : handleCreateLot} disabled={saving || !lotForm.origin.trim()}>
                                {saving ? 'Salvando...' : (editingLot ? 'Atualizar' : 'Adicionar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Produção ────────────────────────────────── */}
            {showProductionModal && productionLot && (
                <div className="modal-overlay" onClick={() => setShowProductionModal(false)}>
                    <div className="modal modal-production" onClick={e => e.stopPropagation()}>
                        <div className="modal-header production">
                            <h2>Registro de Produção - Lote {productionLot.lotNumber}</h2>
                            <span className="prod-origin">{productionLot.origin} | {productionLot.totalCarcassas} carcaças</span>
                            <button className="btn-close" onClick={() => setShowProductionModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row quantities production-inputs">
                                <div className="form-group">
                                    <label>Traseiro (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.traseiro} onChange={e => setProdForm({ ...prodForm, traseiro: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Dianteiro (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.dianteiro} onChange={e => setProdForm({ ...prodForm, dianteiro: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>P. Agulha (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.pontaAgulha} onChange={e => setProdForm({ ...prodForm, pontaAgulha: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Recortes (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.recortes} onChange={e => setProdForm({ ...prodForm, recortes: +e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row quantities production-inputs">
                                <div className="form-group">
                                    <label>Osso (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.osso} onChange={e => setProdForm({ ...prodForm, osso: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Sebo (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.sebo} onChange={e => setProdForm({ ...prodForm, sebo: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Miúdos (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.miudos} onChange={e => setProdForm({ ...prodForm, miudos: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Outros (kg)</label>
                                    <input type="number" min="0" step="0.1" value={prodForm.outros} onChange={e => setProdForm({ ...prodForm, outros: +e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Status do Lote</label>
                                <select value={prodForm.lotStatus} onChange={e => setProdForm({ ...prodForm, lotStatus: e.target.value })}>
                                    <option value="PENDENTE">Pendente</option>
                                    <option value="EM_PROCESSO">Em Processo</option>
                                    <option value="CONCLUIDO">Concluído</option>
                                </select>
                            </div>

                            <div className="production-total">
                                Total produzido: <strong>{prodTotal.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg</strong>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowProductionModal(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSaveProduction} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar Produção'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Importar do Abate ───────────────────────── */}
            {showImportModal && (
                <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Importar Lotes do Abate</h2>
                            <button className="btn-close" onClick={() => setShowImportModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {availableSlaughter.length === 0 ? (
                                <div className="empty-state small">
                                    <AlertTriangle size={32} />
                                    <p>Nenhuma escala de abate fechada nos últimos 30 dias.</p>
                                </div>
                            ) : (
                                <div className="import-list">
                                    {availableSlaughter.map(s => (
                                        <div key={s._id} className="import-item" onClick={() => handleImportSlaughter(s.slaughterDate)}>
                                            <div className="import-date">
                                                {new Date(s.slaughterDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                            </div>
                                            <div className="import-details">
                                                <span>{s.totalCattle} cabeças</span>
                                                <span className="import-breakdown">
                                                    B:{s.totalBoi} V:{s.totalVaca} N:{s.totalNovilha} Bu:{s.totalBubalino} T:{s.totalTouro}
                                                </span>
                                            </div>
                                            <Import size={18} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Configurações ───────────────────────────── */}
            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Configurações da Programação</h2>
                            <button className="btn-close" onClick={() => setShowSettingsModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hora Início</label>
                                    <input type="time" value={settingsForm.startTime} onChange={e => setSettingsForm({ ...settingsForm, startTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Carcaças/Hora</label>
                                    <input type="number" min="1" value={settingsForm.targetCarcassesPerHour} onChange={e => setSettingsForm({ ...settingsForm, targetCarcassesPerHour: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Temp. Câmara (°C)</label>
                                    <input type="number" step="0.1" value={settingsForm.chamberTemperature} onChange={e => setSettingsForm({ ...settingsForm, chamberTemperature: +e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hora Café</label>
                                    <input type="time" value={settingsForm.breakfastTime} onChange={e => setSettingsForm({ ...settingsForm, breakfastTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Duração Café (min)</label>
                                    <input type="number" min="0" value={settingsForm.breakfastDuration} onChange={e => setSettingsForm({ ...settingsForm, breakfastDuration: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Hora Almoço</label>
                                    <input type="time" value={settingsForm.lunchTime} onChange={e => setSettingsForm({ ...settingsForm, lunchTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Duração Almoço (min)</label>
                                    <input type="number" min="0" value={settingsForm.lunchDuration} onChange={e => setSettingsForm({ ...settingsForm, lunchDuration: +e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Observações</label>
                                <textarea value={settingsForm.notes} onChange={e => setSettingsForm({ ...settingsForm, notes: e.target.value })} rows={3} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowSettingsModal(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSaveSettings} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Resumo de Produção ──────────────────────── */}
            {showSummaryModal && productionSummary && (
                <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
                    <div className="modal modal-summary" onClick={e => e.stopPropagation()}>
                        <div className="modal-header production">
                            <h2>Resumo de Produção</h2>
                            <button className="btn-close" onClick={() => setShowSummaryModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="summary-grid">
                                <div className="summary-card">
                                    <h4>Status dos Lotes</h4>
                                    <div className="summary-status-list">
                                        <div className="summary-status-item">
                                            <span className="dot pendente"></span>
                                            <span>Pendentes</span>
                                            <strong>{productionSummary.byStatus.PENDENTE}</strong>
                                        </div>
                                        <div className="summary-status-item">
                                            <span className="dot processo"></span>
                                            <span>Em Processo</span>
                                            <strong>{productionSummary.byStatus.EM_PROCESSO}</strong>
                                        </div>
                                        <div className="summary-status-item">
                                            <span className="dot concluido"></span>
                                            <span>Concluídos</span>
                                            <strong>{productionSummary.byStatus.CONCLUIDO}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <h4>Produção por Corte (kg)</h4>
                                    <div className="production-bars">
                                        {[
                                            { label: 'Traseiro', value: productionSummary.production.traseiro, color: '#ef4444' },
                                            { label: 'Dianteiro', value: productionSummary.production.dianteiro, color: '#f59e0b' },
                                            { label: 'P. Agulha', value: productionSummary.production.ponta, color: '#10b981' },
                                            { label: 'Recortes', value: productionSummary.production.recortes, color: '#6366f1' },
                                            { label: 'Osso', value: productionSummary.production.osso, color: '#8b5cf6' },
                                            { label: 'Sebo', value: productionSummary.production.sebo, color: '#ec4899' }
                                        ].map(item => {
                                            const max = Math.max(
                                                productionSummary.production.traseiro,
                                                productionSummary.production.dianteiro,
                                                productionSummary.production.ponta,
                                                productionSummary.production.recortes,
                                                productionSummary.production.osso,
                                                productionSummary.production.sebo,
                                                1
                                            );
                                            return (
                                                <div key={item.label} className="bar-row">
                                                    <span className="bar-label">{item.label}</span>
                                                    <div className="bar-track">
                                                        <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}></div>
                                                    </div>
                                                    <span className="bar-value">{item.value.toLocaleString('pt-BR')}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="summary-card highlight">
                                    <h4>Rendimento</h4>
                                    <div className="rendimento-display">
                                        <span className="rendimento-value">{productionSummary.rendimentoPercent}%</span>
                                        <span className="rendimento-label">
                                            {productionSummary.totalProduzidoKg.toLocaleString('pt-BR')} kg de {productionSummary.pesoTotalEstimado.toLocaleString('pt-BR')} kg estimados
                                        </span>
                                    </div>
                                </div>

                                {Object.keys(productionSummary.byDestino).length > 0 && (
                                    <div className="summary-card">
                                        <h4>Por Destino</h4>
                                        <div className="destino-list">
                                            {Object.entries(productionSummary.byDestino).map(([key, val]) => (
                                                <div key={key} className="destino-item">
                                                    <span className="destino-name">{key.replace(/_/g, ' ')}</span>
                                                    <span>{val.carcassas} carc.</span>
                                                    <span>{val.produzidoKg.toLocaleString('pt-BR')} kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
