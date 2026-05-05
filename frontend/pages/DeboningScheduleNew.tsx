import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    Clock,
    User,
    Thermometer,
    Plus,
    Beef,
    Box,
    GripVertical,
    Edit2,
    Trash2,
    Package,
    Send,
    Download,
    Import,
    Play,
    Activity,
    Lock,
    CheckCircle2,
    CheckCircle,
    Info,
    ArrowRight,
    RefreshCcw,
    BarChart2,
    List
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

import './DeboningScheduleNew.css';
import deboningService from '../services/deboningService';
import { generateDeboningPDF } from '../utils/deboningPdfGenerator';
import { decomposeAnimal } from '../utils/yieldCalculator';
import { API_URL } from '../services/api';
import { PcpDowntimeModal } from '../components/PcpDowntimeModal';

// --- Types ---
interface Lot {
    _id: string;
    lotNumber: number;
    sequencia?: number;
    origin: string;
    itemCorte?: string;
    qtdPlanejada?: number;
    pesoPlanejadoKg?: number;
    totalCarcassas: number;
    pesoMedioCarcassa: number;
    destino: string;
    lotStatus: 'PENDENTE' | 'EM_PROCESSO' | 'CONCLUIDO' | 'EM_EXECUCAO' | 'PAUSADA' | 'FINALIZADA';
    production?: any;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    manualTimes?: boolean;
    notes?: string;
    // PCP Analytics
    tempoProdutivoMin?: number;
    tempoParadoMin?: number;
    pecasPorHora?: number;
}

interface Schedule {
    _id: string;
    scheduleDate: string;
    startTime: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED';
    chamberTemperature?: number;
    notes?: string;
    responsibleName?: string;
    createdBy: any;
    lots: Lot[];
    slaughterSchedule?: any;
}

// --- Sortable Item Component ---
const SortableRow = ({ lot, onEdit, onDelete, onProduction, onUpdateLot, onStart, onPause, onResume, onFinish }: {
    lot: Lot, onEdit: any, onDelete: any, onProduction: any, onUpdateLot: any,
    onStart: (id: string) => void, onPause: (id: string) => void, onResume: (id: string) => void, onFinish: (id: string) => void
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lot._id });

    const [editStartTime, setEditStartTime] = useState(lot.startTime || '');
    const [editEndTime, setEditEndTime] = useState(lot.endTime || '');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'EM_EXECUCAO': return 'em-processo';
            case 'PAUSADA': return 'pendente';
            case 'FINALIZADA': return 'concluido';
            default: return 'pendente';
        }
    };

    return (
        <tr ref={setNodeRef} style={style}>
            <td {...attributes} {...listeners} style={{ cursor: 'grab' }}>
                <GripVertical size={16} color="#94a3b8" />
            </td>
            <td>{lot.lotNumber}</td>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700 }}>{lot.origin}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{lot.itemCorte}</span>
                </div>
            </td>
            <td><strong>{lot.totalCarcassas}</strong></td>
            <td>
                <div style={{ fontSize: '0.85rem' }}>
                    {lot.tempoProdutivoMin ? (
                        <span style={{ color: '#10b981' }} title="Tempo Produtivo">{lot.tempoProdutivoMin}m</span>
                    ) : '-'}
                    {lot.tempoParadoMin ? (
                        <span style={{ color: '#ef4444', marginLeft: '4px' }} title="Tempo Parado">({lot.tempoParadoMin}m)</span>
                    ) : ''}
                </div>
            </td>
            <td style={{ textAlign: 'right' }}>
                <strong>{((lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                {lot.pecasPorHora ? <div style={{ fontSize: '0.7rem', color: '#6366f1' }}>{lot.pecasPorHora} pç/h</div> : null}
            </td>
            <td>{lot.destino}</td>
            <td>
                <span className={`deb-new-badge ${getStatusClass(lot.lotStatus)}`}>
                    {lot.lotStatus || 'PENDENTE'}
                </span>
            </td>
            <td>
                <div className="table-actions">
                    {lot.lotStatus === 'PENDENTE' && (
                        <button className="deb-new-btn-icon" onClick={() => onStart(lot._id)} title="Iniciar OP">
                            <Play size={16} fill="currentColor" />
                        </button>
                    )}
                    {lot.lotStatus === 'EM_EXECUCAO' && (
                        <>
                            <button className="deb-new-btn-icon" onClick={() => onPause(lot._id)} title="Pausar">
                                <Clock size={16} />
                            </button>
                            <button className="deb-new-btn-icon" onClick={() => onFinish(lot._id)} title="Finalizar">
                                <CheckCircle size={16} />
                            </button>
                        </>
                    )}
                    {lot.lotStatus === 'PAUSADA' && (
                        <button className="deb-new-btn-icon" onClick={() => onResume(lot._id)} title="Retomar">
                            <Play size={16} fill="currentColor" />
                        </button>
                    )}
                    {lot.lotStatus === 'FINALIZADA' && (
                        <button className="deb-new-btn-icon" disabled title="OP Concluída">
                            <CheckCircle2 size={16} color="var(--success)" />
                        </button>
                    )}

                    <button className="deb-new-btn-icon" onClick={() => onEdit(lot)} title="Editar">
                        <Edit2 size={16} />
                    </button>
                    <button className="deb-new-btn-icon danger" onClick={() => onDelete(lot._id)} title="Excluir">
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export const DeboningScheduleNew: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'CARCACA' | 'AVULSO'>('CARCACA');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [localStartTime, setLocalStartTime] = useState('06:00');
    const [localResponsible, setLocalResponsible] = useState('');
    const [pieces, setPieces] = useState<any[]>([]);
    const [showPieceModal, setShowPieceModal] = useState(false);
    const [newPiece, setNewPiece] = useState({ name: '', category: 'OUTROS' });
    const [mainTab, setMainTab] = useState<'PROGRAMACAO' | 'ANALISE'>('PROGRAMACAO');
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const formatTime = (timeStr: string): string => {
        if (!timeStr) return '';
        let clean = timeStr.replace(/[^\d:]/g, '');
        if (!clean.includes(':')) {
            if (clean.length === 1) return `0${clean}:00`;
            if (clean.length === 2) return `${clean}:00`;
            if (clean.length === 3) return `0${clean[0]}:${clean.slice(1)}`;
            if (clean.length === 4) return `${clean.slice(0, 2)}:${clean.slice(2)}`;
            return clean;
        } else {
            let [hours, minutes] = clean.split(':');
            hours = hours.padStart(2, '0').slice(0, 2);
            minutes = minutes.padEnd(2, '0').slice(0, 2);
            return `${hours}:${minutes}`;
        }
    };

    // Form states
    const [carcacaForm, setCarcacaForm] = useState({
        categoria: '',
        qtd: 0,
        peso: 0,
        origem: ''
    });

    const [avulsoForm, setAvulsoForm] = useState({
        corte: '',
        qtd: 0,
        pesoMedio: 0,
        origem: ''
    });

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (date) fetchSchedule();
    }, [date]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const data = await deboningService.getScheduleByDate(date!);
            setSchedule(data);
            setLocalStartTime((data.startTime || '06:00').slice(0, 5));
            setLocalResponsible(data.responsibleName || data.createdBy?.name || '');

            // Buscar peças
            const pcs = await deboningService.getPieces();
            setPieces(pcs);
        } catch (error) {
            console.error('Erro ao buscar programação:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const handleAddCarcaca = async () => {
        if (!schedule || carcacaForm.qtd <= 0 || carcacaForm.peso <= 0) return;

        try {
            const decomposition = decomposeAnimal(carcacaForm.qtd, carcacaForm.peso);

            const animalType = carcacaForm.categoria.toLowerCase().includes('vaca') ? 'vaca' :
                carcacaForm.categoria.toLowerCase().includes('novilha') || carcacaForm.categoria.toLowerCase().includes('novilho') ? 'novilha' :
                    carcacaForm.categoria.toLowerCase().includes('bubalino') ? 'bubalino' :
                        carcacaForm.categoria.toLowerCase().includes('touro') ? 'touro' : 'boi';

            // Adicionar 3 lotes (mínimo)
            const lotsToAdd = [
                {
                    origin: `${carcacaForm.origem} - TRASEIRO`,
                    [animalType]: decomposition.traseiro.quantity,
                    totalCarcassas: decomposition.traseiro.quantity,
                    pesoMedioCarcassa: decomposition.traseiro.avgWeight,
                    destino: 'MERCADO_INTERNO'
                },
                {
                    origin: `${carcacaForm.origem} - DIANTEIRO`,
                    [animalType]: decomposition.dianteiro.quantity,
                    totalCarcassas: decomposition.dianteiro.quantity,
                    pesoMedioCarcassa: decomposition.dianteiro.avgWeight,
                    destino: 'MERCADO_INTERNO'
                },
                {
                    origin: `${carcacaForm.origem} - PONTA AGULHA`,
                    [animalType]: decomposition.pontaAgulha.quantity,
                    totalCarcassas: decomposition.pontaAgulha.quantity,
                    pesoMedioCarcassa: decomposition.pontaAgulha.avgWeight,
                    destino: 'MERCADO_INTERNO'
                }
            ];

            for (const lot of lotsToAdd) {
                await deboningService.createLot(schedule._id, lot);
            }

            setCarcacaForm({ categoria: 'Boi China', qtd: 0, peso: 0, origem: 'Abate Interno' });
            fetchSchedule();
        } catch (error) {
            alert('Erro ao adicionar lotes de carcaça');
        }
    };

    const handleAddAvulso = async () => {
        if (!schedule || avulsoForm.qtd <= 0 || avulsoForm.pesoMedio <= 0) return;

        try {
            await deboningService.createLot(schedule._id, {
                origin: `${avulsoForm.origem} - ${avulsoForm.corte.toUpperCase()}`,
                boi: avulsoForm.qtd, // Default to 'boi' for avulsos if type not specified, or we could add type to avulsoForm
                totalCarcassas: avulsoForm.qtd,
                pesoMedioCarcassa: avulsoForm.pesoMedio,
                destino: 'MERCADO_INTERNO'
            });

            setAvulsoForm({ corte: 'Traseiro', qtd: 0, pesoMedio: 0, origem: 'Estoque' });
            fetchSchedule();
        } catch (error) {
            alert('Erro ao adicionar lote avulso');
        }
    };

    const handleDeleteLot = async (id: string) => {
        if (!window.confirm('Excluir este lote?')) return;
        try {
            await deboningService.deleteLot(id);
            fetchSchedule();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const handleUpdateLot = async (id: string, data: any) => {
        try {
            await deboningService.updateLot(id, data);
            // Atualização otimista local
            if (schedule) {
                const newLots = schedule.lots.map(l => l._id === id ? { ...l, ...data } : l);
                setSchedule({ ...schedule, lots: newLots });
            }
        } catch (error) {
            console.error('Erro ao atualizar lote:', error);
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!schedule || active.id === over.id) return;

        const oldIndex = schedule.lots.findIndex(l => l._id === active.id);
        const newIndex = schedule.lots.findIndex(l => l._id === over.id);

        const newLots = arrayMove(schedule.lots, oldIndex, newIndex);
        setSchedule({ ...schedule, lots: newLots });

        try {
            await deboningService.reorderLots(schedule._id, newLots.map(l => l._id));
        } catch (error) {
            console.error('Erro ao reordenar:', error);
        }
    };

    const handleStartProduction = async () => {
        if (!schedule) return;
        try {
            await deboningService.startSchedule(schedule._id);
            fetchSchedule();
        } catch (error) {
            alert('Erro ao iniciar produção');
        }
    };

    const handleCloseProduction = async () => {
        if (!schedule) return;
        if (!window.confirm('Deseja fechar a produção do dia?')) return;
        try {
            await deboningService.closeSchedule(schedule._id);
            fetchSchedule();
        } catch (error) {
            alert('Erro ao fechar produção');
        }
    };

    const handleReopenSchedule = async () => {
        if (!schedule) return;
        if (!window.confirm('Deseja reabrir esta programação? Ela voltará para o estado de Rascunho.')) return;
        try {
            await deboningService.reopenSchedule(schedule._id);
            fetchSchedule();
        } catch (error) {
            alert('Erro ao reabrir programação');
        }
    };

    const handleUpdateNotes = async (notes: string) => {
        if (!schedule) return;
        try {
            await deboningService.updateSchedule(schedule._id, { notes });
            setSchedule({ ...schedule, notes });
        } catch (error) {
            console.error('Erro ao salvar notas');
        }
    };

    const handleUpdateResponsible = async (val: string) => {
        if (!schedule) return;
        try {
            await deboningService.updateSchedule(schedule._id, { responsibleName: val });
            setSchedule({ ...schedule, responsibleName: val });
        } catch (error) {
            console.error('Erro ao salvar responsável');
        }
    };

    const handleUpdateStartTime = async (val: string) => {
        if (!schedule) return;
        try {
            await deboningService.updateSchedule(schedule._id, { startTime: val });
            setSchedule({ ...schedule, startTime: val });
        } catch (error) {
            console.error('Erro ao salvar hora de início');
        }
    };

    const handleCreatePiece = async () => {
        if (!newPiece.name) return;
        try {
            const created = await deboningService.createPiece(newPiece);
            setPieces([...pieces, created]);
            setNewPiece({ name: '', category: 'OUTROS' });
        } catch (error) {
            alert('Erro ao criar peça');
        }
    };

    const handleDeletePiece = async (id: string) => {
        if (!window.confirm('Excluir esta peça?')) return;
        try {
            await deboningService.deletePiece(id);
            setPieces(pieces.filter(p => p._id !== id));
        } catch (error) {
            alert('Erro ao excluir peça');
        }
    };

    const [showDowntimeModal, setShowDowntimeModal] = useState(false);
    const [selectedOpId, setSelectedOpId] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        if (!schedule) return;
        setLoadingAnalytics(true);
        try {
            const data = await deboningService.getAnalytics(schedule._id);
            setAnalytics(data);
        } catch (error) {
            console.error('Erro ao carregar analytics');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        if (mainTab === 'ANALISE') {
            fetchAnalytics();
        }
    }, [mainTab]);


    const handleSendReport = () => {
        if (!schedule) return;
        setSendingMsg(true);
        const text = document.getElementById('preview-text')?.innerText || '';
        navigator.clipboard.writeText(text);

        const win = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        if (win) win.focus();

        setTimeout(() => setSendingMsg(false), 3000);
    };

    // --- PCP Execution Handlers ---
    const handleStartOp = async (opId: string) => {
        try {
            await deboningService.startOp(opId);
            fetchSchedule();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao iniciar OP');
        }
    };

    const handlePauseOp = (opId: string) => {
        setSelectedOpId(opId);
        setShowDowntimeModal(true);
    };

    const handleConfirmPause = async (data: { motivoParadaId: string; observacao: string }) => {
        if (!selectedOpId) return;
        try {
            await deboningService.pauseOp(selectedOpId, data);
            setShowDowntimeModal(false);
            setSelectedOpId(null);
            fetchSchedule();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao pausar OP');
        }
    };

    const handleResumeOp = async (opId: string) => {
        try {
            await deboningService.resumeOp(opId);
            fetchSchedule();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao retomar OP');
        }
    };

    const handleFinishOp = async (opId: string) => {
        const lot = schedule?.lots.find(l => l._id === opId);
        if (!lot) return;

        const qtdReal = prompt('Quantidade Real Produzida (Peças):', lot.totalCarcassas.toString());
        if (qtdReal === null) return;

        const pesoReal = prompt('Peso Real Produzido (Kg):', ((lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0)).toString());
        if (pesoReal === null) return;

        try {
            await deboningService.finishOp(opId, {
                fimReal: new Date().toISOString(),
                qtdReal: parseInt(qtdReal),
                pesoRealKg: parseFloat(pesoReal),
                observacao: 'Finalizado via painel operacional'
            });
            fetchSchedule();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao finalizar OP');
        }
    };

    // --- Calculations ---
    const stats = useMemo(() => {
        if (!schedule) return { totalPecas: 0, totalWeight: 0, totalProduced: 0, yield: 0 };
        const totalPecas = schedule.lots.reduce((acc, lot) => acc + (lot.totalCarcassas || 0), 0);
        const totalWeight = schedule.lots.reduce((acc, lot) => acc + (lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0), 0);

        const totalProduced = schedule.lots.reduce((acc, lot) => {
            const p = lot.production || {};
            return acc + (p.traseiro || 0) + (p.dianteiro || 0) + (p.pontaAgulha || 0) +
                (p.recortes || 0) + (p.osso || 0) + (p.sebo || 0) + (p.miudos || 0) + (p.outros || 0);
        }, 0);

        const yielding = totalWeight > 0 ? (totalProduced / totalWeight) * 100 : 0;

        return { totalPecas, totalWeight, totalProduced, yield: yielding };
    }, [schedule]);

    const chartData = useMemo(() => {
        if (!schedule) return [];
        const cuts: any = {};
        schedule.lots.forEach(lot => {
            const cut = lot.origin.split(' - ').pop() || 'OUTROS';
            cuts[cut] = (cuts[cut] || 0) + lot.totalCarcassas;
        });
        return Object.keys(cuts).map(key => ({ name: key, value: cuts[key] }));
    }, [schedule]);

    const COLORS = ['#667eea', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];

    if (loading) {
        return (
            <div className="deb-new-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="deb-new-page">
            {/* --- Cabeçalho Fixo --- */}
            <div className="deb-new-header">
                <div className="deb-new-header-title">
                    <button className="deb-new-btn-icon" onClick={() => navigate('/pcp')}>
                        <ChevronLeft />
                    </button>
                    <Calendar size={24} color="var(--primary)" />
                    <h1>Programação de Desossa</h1>
                    <span className={`deb-new-status`}>
                        {schedule?.status === 'DRAFT' && <span className="deb-new-badge pendente"><Info size={14} /> Rascunho</span>}
                        {schedule?.status === 'IN_PROGRESS' && <span className="deb-new-badge em-processo"><Activity size={14} /> Em Produção</span>}
                        {schedule?.status === 'CLOSED' && <span className="deb-new-badge concluido"><CheckCircle2 size={14} /> Fechado</span>}
                    </span>
                </div>
                <div className="deb-new-header-actions">
                    {schedule?.status === 'IN_PROGRESS' && (
                        <button className="deb-new-btn-primary" onClick={handleCloseProduction} style={{ background: 'var(--danger)', boxShadow: 'none' }}>
                            <Lock size={18} /> Fechar Dia
                        </button>
                    )}
                    {schedule?.status === 'CLOSED' && (
                        <button className="deb-new-btn-outline" onClick={handleReopenSchedule}>
                            <RefreshCcw size={18} /> Reabrir Programação
                        </button>
                    )}
                    <button className="deb-new-btn-outline" onClick={() => setShowPieceModal(true)}>
                        <Beef size={18} /> Peças
                    </button>
                </div>
            </div>

            {/* --- Tabs Principais --- */}
            <div className="deb-new-main-tabs">
                <button
                    className={`deb-new-main-tab ${mainTab === 'PROGRAMACAO' ? 'active' : ''}`}
                    onClick={() => setMainTab('PROGRAMACAO')}
                >
                    <List size={18} /> Programação Diária
                </button>
                <button
                    className={`deb-new-main-tab ${mainTab === 'ANALISE' ? 'active' : ''}`}
                    onClick={() => setMainTab('ANALISE')}
                >
                    <BarChart2 size={18} /> Rendimento & Custo
                </button>
            </div>

            {/* --- Conteúdo das Tabs --- */}
            {mainTab === 'PROGRAMACAO' ? (
                <div className="deb-new-container">
                    {/* Coluna Esquerda: Cadastro e Tabela */}
                    <div>
                        <div className="deb-new-card" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                                <div className="deb-new-form-group">
                                    <label>Data</label>
                                    <input type="date" value={schedule?.scheduleDate ? new Date(schedule.scheduleDate).toISOString().split('T')[0] : ''} disabled />
                                </div>
                                <div className="deb-new-form-group">
                                    <label>Responsável</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type="text"
                                            style={{ paddingLeft: '30px' }}
                                            value={localResponsible}
                                            onChange={(e) => setLocalResponsible(e.target.value)}
                                            onBlur={(e) => handleUpdateResponsible(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="deb-new-form-group">
                                    <label>Hora Início</label>
                                    <input
                                        type="text"
                                        value={localStartTime}
                                        onChange={(e) => setLocalStartTime(e.target.value)}
                                        onBlur={(e) => {
                                            const formatted = formatTime(e.target.value);
                                            setLocalStartTime(formatted);
                                            handleUpdateStartTime(formatted);
                                        }}
                                        maxLength={5}
                                    />
                                </div>
                                <div className="deb-new-form-group">
                                    <label>Temp. Câmara (°C)</label>
                                    <input type="number" step="0.1" defaultValue={schedule?.chamberTemperature || 2.5} />
                                </div>
                            </div>
                        </div>

                        <div className="deb-new-card">
                            <div className="deb-new-tabs">
                                <button className={`deb-new-tab ${activeTab === 'CARCACA' ? 'active' : ''}`} onClick={() => setActiveTab('CARCACA')}>
                                    <Beef size={18} /> Entrada de Carcaças
                                </button>
                                <button className={`deb-new-tab ${activeTab === 'AVULSO' ? 'active' : ''}`} onClick={() => setActiveTab('AVULSO')}>
                                    <Package size={18} /> Itens Avulsos
                                </button>
                            </div>

                            {activeTab === 'CARCACA' ? (
                                <div className="deb-new-form-inline">
                                    <div className="deb-new-form-group">
                                        <label>Categoria / Peça</label>
                                        <select value={carcacaForm.categoria} onChange={e => setCarcacaForm({ ...carcacaForm, categoria: e.target.value })}>
                                            <option value="">-- Selecione --</option>
                                            {pieces.filter(p => !['TRASEIRO', 'DIANTEIRO', 'PONTA_AGULHA'].includes(p.category)).map(p => (
                                                <option key={p._id} value={p.name}>{p.name}</option>
                                            ))}
                                            <option>Novilho Precoce</option>
                                            <option>Boi China</option>
                                        </select>
                                    </div>
                                    <div className="deb-new-form-group">
                                        <label>Qtd (Cabeças)</label>
                                        <input type="number" value={carcacaForm.qtd} onChange={e => setCarcacaForm({ ...carcacaForm, qtd: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="deb-new-form-group">
                                        <label>Peso Total (kg)</label>
                                        <input type="number" step="0.01" value={carcacaForm.peso} onChange={e => setCarcacaForm({ ...carcacaForm, peso: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="deb-new-form-group">
                                        <label>Origem</label>
                                        <input type="text" value={carcacaForm.origem} onChange={e => setCarcacaForm({ ...carcacaForm, origem: e.target.value })} />
                                    </div>
                                    <button className="deb-new-btn-add" onClick={handleAddCarcaca}><Plus /></button>
                                </div>
                            ) : (
                                <div className="deb-new-form-inline">
                                    <div className="deb-new-form-group">
                                        <label>Tipo de Peça</label>
                                        <select value={avulsoForm.corte} onChange={e => setAvulsoForm({ ...avulsoForm, corte: e.target.value })}>
                                            <option value="">-- Selecione --</option>
                                            {pieces.map(p => (
                                                <option key={p._id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="deb-new-form-group">
                                        <label>Qtd</label>
                                        <input type="number" value={avulsoForm.qtd} onChange={e => setAvulsoForm({ ...avulsoForm, qtd: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="deb-new-form-group">
                                        <label>Peso Médio</label>
                                        <input type="number" step="0.01" value={avulsoForm.pesoMedio} onChange={e => setAvulsoForm({ ...avulsoForm, pesoMedio: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="deb-new-form-group">
                                        <label>Origem</label>
                                        <input type="text" value={avulsoForm.origem} onChange={e => setAvulsoForm({ ...avulsoForm, origem: e.target.value })} />
                                    </div>
                                    <button className="deb-new-btn-add" onClick={handleAddAvulso}><Plus /></button>
                                </div>
                            )}
                        </div>

                        <div className="deb-new-card" style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Lotes Programados (OPs)</h3>
                                <button className="deb-new-btn-outline" onClick={() => fetchSchedule()}><RefreshCcw size={16} /> Atualizar</button>
                            </div>
                            <div className="deb-new-table-container">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <table className="deb-new-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '30px' }}></th>
                                                <th>#</th>
                                                <th>Item</th>
                                                <th>Qtd</th>
                                                <th>T. Prod</th>
                                                <th style={{ textAlign: 'right' }}>Total (kg)</th>
                                                <th>Destino</th>
                                                <th>Status</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <SortableContext items={schedule?.lots.map(l => l._id) || []} strategy={verticalListSortingStrategy}>
                                            <tbody>
                                                {schedule?.lots.map((lot) => (
                                                    <SortableRow
                                                        key={lot._id}
                                                        lot={lot}
                                                        onEdit={() => { }}
                                                        onDelete={handleDeleteLot}
                                                        onProduction={() => { }}
                                                        onUpdateLot={handleUpdateLot}
                                                        onStart={handleStartOp}
                                                        onPause={handlePauseOp}
                                                        onResume={handleResumeOp}
                                                        onFinish={handleFinishOp}
                                                    />
                                                ))}
                                            </tbody>
                                        </SortableContext>
                                    </table>
                                </DndContext>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Dash e Mensagem */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="deb-new-card">
                            <h3><Activity size={18} /> Resumo Operacional</h3>
                            <div className="deb-new-kpi-grid">
                                <div className="deb-new-kpi">
                                    <div className="deb-new-kpi-label">Total Peças</div>
                                    <div className="deb-new-kpi-value">{stats.totalPecas}</div>
                                </div>
                                <div className="deb-new-kpi">
                                    <div className="deb-new-kpi-label">Volume (Ton)</div>
                                    <div className="deb-new-kpi-value">{(stats.totalWeight / 1000).toFixed(2)}</div>
                                </div>
                                <div className="deb-new-kpi">
                                    <div className="deb-new-kpi-label">Rendimento Est.</div>
                                    <div className="deb-new-kpi-value">{stats.yield.toFixed(1)}%</div>
                                </div>
                            </div>

                            <div className="deb-new-preview-container">
                                <div className="deb-new-preview" id="preview-text">
                                    {`Programação Desossa\nData: ${date}\nTOTAL: ${stats.totalPecas} Peças\nPESO: ${(stats.totalWeight / 1000).toFixed(2)} Ton`}
                                </div>
                            </div>

                            <div className="deb-new-action-buttons">
                                <button className="deb-new-btn-primary" onClick={handleSendReport}>
                                    {sendingMsg ? 'Enviado!' : 'Enviar WhatsApp'}
                                </button>
                                <button className="deb-new-btn-outline" onClick={() => schedule && generateDeboningPDF(schedule)}>
                                    <Download size={18} /> PDF
                                </button>
                            </div>
                        </div>

                        <div className="deb-new-chart-card">
                            <div style={{ width: '100%', height: '220px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="deb-analise-container">
                    {loadingAnalytics ? (
                        <div className="deb-new-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <RefreshCcw className="spinner" size={32} style={{ margin: '0 auto 16px' }} />
                            <p>Processando custos e rendimento...</p>
                        </div>
                    ) : (
                        <>
                            <div className="deb-analise-summary-cards">
                                <div className="deb-analise-card primary">
                                    <label>Custo Médio / Kg</label>
                                    <div className="value">R$ {analytics?.summary?.custoMedioKg || '0.00'}</div>
                                </div>
                                <div className="deb-analise-card success">
                                    <label>Rendimento Real</label>
                                    <div className="value">{analytics?.summary?.rendimentoGlobal || '0'}%</div>
                                </div>
                                <div className="deb-analise-card warning">
                                    <label>Tempo Parado</label>
                                    <div className="value">{analytics?.summary?.totalTempoParado || '0'} min</div>
                                </div>
                                <div className="deb-analise-card info">
                                    <label>Pç/h Efetivo</label>
                                    <div className="value">{analytics?.summary?.pecasHoraGlobal || '0'}</div>
                                </div>
                            </div>

                            <div className="deb-analise-grid">
                                <div className="deb-new-card">
                                    <h3>Performance por OP</h3>
                                    <div className="deb-new-table-container">
                                        <table className="deb-analise-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>In (kg)</th>
                                                    <th>Out (kg)</th>
                                                    <th>Rend %</th>
                                                    <th>T. Prod</th>
                                                    <th>R$/kg</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics?.ops.map((op: any) => (
                                                    <tr key={op._id}>
                                                        <td>{op.itemCorte}</td>
                                                        <td>{op.origemEntradaKg}</td>
                                                        <td>{op.pesoRealKg}</td>
                                                        <td style={{ fontWeight: 800, color: op.rendimentoPct > 70 ? 'var(--success)' : 'var(--warning)' }}>{op.rendimentoPct}%</td>
                                                        <td>{op.tempoProdutivoMin}m</td>
                                                        <td><strong>R$ {op.custoPorKg}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="deb-new-card">
                                    <h3>Causas de Parada (Pareto)</h3>
                                    <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics?.pareto}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                                <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                                    itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                                                />
                                                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* --- Modais Finais --- */}
            {showPieceModal && (
                <div className="deb-modal-overlay">
                    <div className="deb-modal">
                        <div className="deb-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Beef color="var(--primary)" size={24} />
                                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem' }}>Gestão de Peças</h2>
                            </div>
                            <button className="deb-close" onClick={() => setShowPieceModal(false)}>&times;</button>
                        </div>
                        <div className="deb-modal-body">
                            <div className="deb-new-form-inline" style={{ gridTemplateColumns: '1fr auto', marginBottom: '24px' }}>
                                <div className="deb-new-form-group">
                                    <label>Novo Nome da Peça</label>
                                    <input
                                        placeholder="Ex: Picanha, Alcatra..."
                                        value={newPiece.name}
                                        onChange={e => setNewPiece({ ...newPiece, name: e.target.value })}
                                    />
                                </div>
                                <button className="deb-new-btn-add" onClick={handleCreatePiece} style={{ alignSelf: 'end' }}>
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="deb-new-table-container">
                                <table className="deb-new-table">
                                    <thead>
                                        <tr>
                                            <th>Nome da Peça</th>
                                            <th style={{ textAlign: 'right' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pieces.map(pc => (
                                            <tr key={pc._id}>
                                                <td style={{ fontWeight: 600 }}>{pc.name}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="deb-new-btn-icon danger" onClick={() => handleDeletePiece(pc._id)} title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PcpDowntimeModal
                isOpen={showDowntimeModal}
                opId={selectedOpId || ''}
                onClose={() => setShowDowntimeModal(false)}
                onConfirm={handleConfirmPause}
            />
        </div>
    );
};

export default DeboningScheduleNew;
