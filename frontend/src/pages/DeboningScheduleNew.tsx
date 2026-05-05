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
    List,
    X
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
import deboningBrokerService from '../services/deboningBrokerService';
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
    broker?: {
        _id: string;
        name: string;
    };
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
            case 'EM_EXECUCAO': return 'warning';
            case 'PAUSADA': return 'danger';
            case 'FINALIZADA': return 'success';
            default: return 'info';
        }
    };

    return (
        <tr ref={setNodeRef} style={style} className={isDragging ? 'is-dragging' : ''}>
            <td {...attributes} {...listeners} data-handler>
                <GripVertical size={16} />
            </td>
            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{lot.lotNumber}</td>
            <td>
                <div className="stack-info" style={{ gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.938rem' }}>{lot.origin}</span>
                        {lot.broker && (
                            <span className="badge-broker" title={`Corretor: ${lot.broker.name}`}>
                                {lot.broker.name.split(' ')[0]}
                            </span>
                        )}
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{lot.itemCorte}</span>
                </div>
            </td>
            <td>
                <span className="count-badge">{lot.totalCarcassas}</span>
            </td>
            <td>
                <div className="timer-info-mini">
                    {lot.tempoProdutivoMin ? (
                        <span className="text-success" style={{ fontWeight: 700 }} title="Tempo Produtivo">{lot.tempoProdutivoMin}m</span>
                    ) : '-'}
                    {lot.tempoParadoMin ? (
                        <span className="text-error" style={{ marginLeft: '4px', fontSize: '0.813rem' }} title="Tempo Parado">({lot.tempoParadoMin}m)</span>
                    ) : ''}
                </div>
            </td>
            <td className="text-right">
                <div className="stack-info" style={{ alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {((lot.totalCarcassas || 0) * (lot.pesoMedioCarcassa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                        <small style={{ fontSize: '0.7rem', marginLeft: '2px' }}>kg</small>
                    </span>
                    {lot.pecasPorHora ? (
                        <span className="text-primary" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                            {lot.pecasPorHora} pç/h
                        </span>
                    ) : null}
                </div>
            </td>
            <td>
                <span className={`status-badge-premium info`}>
                    {lot.destino?.replace('_', ' ')}
                </span>
            </td>
            <td>
                <span className={`status-badge-premium ${getStatusClass(lot.lotStatus)}`}>
                    {lot.lotStatus?.replace('_', ' ') || 'PENDENTE'}
                </span>
            </td>
            <td className="text-right">
                <div className="action-buttons">
                    {lot.lotStatus === 'PENDENTE' && (
                        <button className="btn-icon" onClick={() => onStart(lot._id)} title="Iniciar OP">
                            <Play size={16} fill="currentColor" />
                        </button>
                    )}
                    {lot.lotStatus === 'EM_EXECUCAO' && (
                        <>
                            <button className="btn-icon warning" onClick={() => onPause(lot._id)} title="Pausar">
                                <Clock size={16} />
                            </button>
                            <button className="btn-icon success" onClick={() => onFinish(lot._id)} title="Finalizar">
                                <CheckCircle size={16} />
                            </button>
                        </>
                    )}
                    {lot.lotStatus === 'PAUSADA' && (
                        <button className="btn-icon primary" onClick={() => onResume(lot._id)} title="Retomar">
                            <Play size={16} fill="currentColor" />
                        </button>
                    )}
                    {lot.lotStatus === 'FINALIZADA' && (
                        <span className="text-success" style={{ padding: '8px' }}>
                            <CheckCircle2 size={18} />
                        </span>
                    )}

                    <button className="btn-icon" onClick={() => onEdit(lot)} title="Editar">
                        <Edit2 size={16} />
                    </button>
                    <button className="btn-icon danger" onClick={() => onDelete(lot._id)} title="Excluir">
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
    const [brokers, setBrokers] = useState<any[]>([]);

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
        origem: '',
        brokerId: ''
    });

    const [avulsoForm, setAvulsoForm] = useState({
        corte: '',
        qtd: 0,
        pesoMedio: 0,
        origem: '',
        brokerId: ''
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

            // Buscar corretores
            const bkrs = await deboningBrokerService.getBrokers();
            setBrokers(bkrs);
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
                    broker: carcacaForm.brokerId || undefined,
                    [animalType]: decomposition.traseiro.quantity,
                    totalCarcassas: decomposition.traseiro.quantity,
                    pesoMedioCarcassa: decomposition.traseiro.avgWeight,
                    destino: 'MERCADO_INTERNO'
                },
                {
                    origin: `${carcacaForm.origem} - DIANTEIRO`,
                    broker: carcacaForm.brokerId || undefined,
                    [animalType]: decomposition.dianteiro.quantity,
                    totalCarcassas: decomposition.dianteiro.quantity,
                    pesoMedioCarcassa: decomposition.dianteiro.avgWeight,
                    destino: 'MERCADO_INTERNO'
                },
                {
                    origin: `${carcacaForm.origem} - PONTA AGULHA`,
                    broker: carcacaForm.brokerId || undefined,
                    [animalType]: decomposition.pontaAgulha.quantity,
                    totalCarcassas: decomposition.pontaAgulha.quantity,
                    pesoMedioCarcassa: decomposition.pontaAgulha.avgWeight,
                    destino: 'MERCADO_INTERNO'
                }
            ];

            for (const lot of lotsToAdd) {
                await deboningService.createLot(schedule._id, lot);
            }

            setCarcacaForm({ categoria: 'Boi China', qtd: 0, peso: 0, origem: 'Abate Interno', brokerId: '' });
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
                broker: avulsoForm.brokerId || undefined,
                boi: avulsoForm.qtd, // Default to 'boi' for avulsos if type not specified, or we could add type to avulsoForm
                totalCarcassas: avulsoForm.qtd,
                pesoMedioCarcassa: avulsoForm.pesoMedio,
                destino: 'MERCADO_INTERNO'
            });

            setAvulsoForm({ corte: 'Traseiro', qtd: 0, pesoMedio: 0, origem: 'Estoque', brokerId: '' });
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
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn-icon tertiary" onClick={() => navigate('/pcp')}>
                            <ChevronLeft />
                        </button>
                        <Calendar className="text-primary" size={24} />
                        <div>
                            <h1>Programação de Desossa</h1>
                            <div style={{ marginTop: '4px' }}>
                                {schedule?.status === 'DRAFT' && <span className="status-badge-premium info">Rascunho</span>}
                                {schedule?.status === 'IN_PROGRESS' && <span className="status-badge-premium warning">Em Produção</span>}
                                {schedule?.status === 'CLOSED' && <span className="status-badge-premium success">Fechado</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    {schedule?.status === 'DRAFT' && (
                        <button className="btn-primary" onClick={handleStartProduction}>
                            <Play size={18} fill="currentColor" /> Iniciar Produção
                        </button>
                    )}
                    {schedule?.status === 'IN_PROGRESS' && (
                        <button className="btn-primary danger" onClick={handleCloseProduction}>
                            <Lock size={18} /> Fechar Dia
                        </button>
                    )}
                    {schedule?.status === 'CLOSED' && (
                        <button className="btn-secondary" onClick={handleReopenSchedule}>
                            <RefreshCcw size={18} /> Reabrir
                        </button>
                    )}
                    <button className="btn-secondary" onClick={() => {
                        if (schedule) {
                            generateDeboningPDF(schedule);
                        }
                    }}>
                        <Download size={18} /> Pré-Escala PDF
                    </button>
                    <button className="btn-secondary" onClick={() => setShowPieceModal(true)}>
                        <Beef size={18} /> Peças
                    </button>
                </div>
            </header>

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
                        <div className="content-card" style={{ marginBottom: '24px', padding: '0', overflow: 'visible', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className="filter-bar-premium">
                                <div className="form-group-premium">
                                    <label>Data da Programação</label>
                                    <input 
                                        type="date" 
                                        value={schedule?.scheduleDate ? new Date(schedule.scheduleDate).toISOString().split('T')[0] : ''} 
                                        disabled 
                                    />
                                </div>
                                <div className="form-group-premium">
                                    <label>Corretor</label>
                                    <div className="input-with-icon">
                                        <User size={18} />
                                        <select
                                            style={{ paddingLeft: '42px' }}
                                            value={schedule?.lots?.[0]?.broker?._id || ''}
                                            onChange={(e) => {
                                                // Store broker selection for new lots
                                                setLocalResponsible(brokers.find(b => b._id === e.target.value)?.name || '');
                                            }}
                                        >
                                            <option value="">Selecione...</option>
                                            {brokers.map((b: any) => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group-premium">
                                    <label>Início Previsto</label>
                                    <div className="input-with-icon">
                                        <Clock size={18} />
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
                                            placeholder="00:00"
                                        />
                                    </div>
                                </div>
                                <div className="form-group-premium">
                                    <label>Temp. Câmara (°C)</label>
                                    <div className="input-with-icon">
                                        <Thermometer size={18} />
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            defaultValue={schedule?.chamberTemperature || 2.5} 
                                            onBlur={(e) => handleUpdateLot(schedule!._id, { chamberTemperature: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="content-card">
                            <div className="deb-new-tabs">
                                <button className={`deb-new-tab ${activeTab === 'CARCACA' ? 'active' : ''}`} onClick={() => setActiveTab('CARCACA')}>
                                    <Beef size={16} /> Carcaças
                                </button>
                                <button className={`deb-new-tab ${activeTab === 'AVULSO' ? 'active' : ''}`} onClick={() => setActiveTab('AVULSO')}>
                                    <Package size={16} /> Itens Avulsos
                                </button>
                            </div>

                            {activeTab === 'CARCACA' ? (
                                <div className="deb-new-form-inline">
                                    <div className="form-group-premium">
                                        <label>Peça / Categoria</label>
                                        <select value={carcacaForm.categoria} onChange={e => setCarcacaForm({ ...carcacaForm, categoria: e.target.value })}>
                                            <option value="">Selecione...</option>
                                            {pieces.filter(p => !['TRASEIRO', 'DIANTEIRO', 'PONTA_AGULHA'].includes(p.category)).map(p => (
                                                <option key={p._id} value={p.name}>{p.name}</option>
                                            ))}
                                            <option>Novilho Precoce</option>
                                            <option>Boi China</option>
                                        </select>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Quantidade</label>
                                        <input type="number" value={carcacaForm.qtd} onChange={e => setCarcacaForm({ ...carcacaForm, qtd: parseInt(e.target.value) || 0 })} placeholder="Mínimo 1" />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Peso Total (kg)</label>
                                        <input type="number" step="0.01" value={carcacaForm.peso} onChange={e => setCarcacaForm({ ...carcacaForm, peso: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Origem / Lote Escala</label>
                                        <input type="text" value={carcacaForm.origem} onChange={e => setCarcacaForm({ ...carcacaForm, origem: e.target.value })} placeholder="Ex: Abate Próprio" />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Corretor (Terceiro)</label>
                                        <select value={carcacaForm.brokerId} onChange={e => setCarcacaForm({ ...carcacaForm, brokerId: e.target.value })}>
                                            <option value="">Nenhum (Próprio)</option>
                                            {brokers.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="btn-primary" onClick={handleAddCarcaca} style={{ padding: '10px 20px', minWidth: 'unset' }}>
                                        <Plus size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="deb-new-form-inline">
                                    <div className="form-group-premium">
                                        <label>Item / Corte</label>
                                        <select value={avulsoForm.corte} onChange={e => setAvulsoForm({ ...avulsoForm, corte: e.target.value })}>
                                            <option value="">Selecione...</option>
                                            {pieces.map(p => (
                                                <option key={p._id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Quantidade</label>
                                        <input type="number" value={avulsoForm.qtd} onChange={e => setAvulsoForm({ ...avulsoForm, qtd: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Peso Unitário</label>
                                        <input type="number" step="0.01" value={avulsoForm.pesoMedio} onChange={e => setAvulsoForm({ ...avulsoForm, pesoMedio: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Proveniência</label>
                                        <input type="text" value={avulsoForm.origem} onChange={e => setAvulsoForm({ ...avulsoForm, origem: e.target.value })} />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Corretor</label>
                                        <select value={avulsoForm.brokerId} onChange={e => setAvulsoForm({ ...avulsoForm, brokerId: e.target.value })}>
                                            <option value="">Nenhum</option>
                                            {brokers.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="btn-primary" onClick={handleAddAvulso} style={{ padding: '10px 20px', minWidth: 'unset' }}>
                                        <Plus size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="content-card" style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Lotes Programados (Ordens de Produção)</h3>
                                <button className="btn-secondary" onClick={() => fetchSchedule()} style={{ padding: '8px 14px' }}>
                                    <RefreshCcw size={16} /> <span style={{ marginLeft: '4px' }}>Sincronizar</span>
                                </button>
                            </div>
                            <div className="table-container" style={{ border: 'none' }}>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <table className="ivory-table premium-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}></th>
                                                <th>Lote</th>
                                                <th>Item / Origem</th>
                                                <th>Carcassas</th>
                                                <th>T. Produtivo</th>
                                                <th className="text-right">Peso Total (kg)</th>
                                                <th>Mercado</th>
                                                <th>Status</th>
                                                <th className="text-right">Ações</th>
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

                    {/* Coluna Direita: Resumo */}
                    <div className="deb-new-kpi-grid">
                        <div className="deb-new-kpi">
                            <div className="deb-new-kpi-label">Volume Total</div>
                            <div className="deb-new-kpi-value">
                                {stats.totalPecas}
                                <span className="deb-new-kpi-unit">PÇS</span>
                            </div>
                        </div>

                        <div className="deb-new-kpi">
                            <div className="deb-new-kpi-label">Peso Estimado</div>
                            <div className="deb-new-kpi-value">
                                {stats.totalWeight.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                <span className="deb-new-kpi-unit">KG</span>
                            </div>
                        </div>

                        <div className="deb-new-chart-card" style={{ padding: '24px' }}>
                            <div className="deb-new-chart-title">
                                <Activity size={16} /> Distribuição de Cortes
                            </div>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="content-card" style={{ padding: '20px' }}>
                            <div className="deb-new-chart-title">
                                <Info size={16} /> Observações do Dia
                            </div>
                            <textarea
                                className="form-control"
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    fontSize: '0.875rem',
                                    background: 'var(--bg-soft)',
                                    color: 'var(--text)',
                                    resize: 'none'
                                }}
                                value={schedule?.notes || ''}
                                onChange={(e) => setSchedule(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                onBlur={(e) => handleUpdateNotes(e.target.value)}
                                placeholder="Notas técnicas, ocorrências ou observações produtivas..."
                            />
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

            {mainTab === 'ANALISE' && (
                <div className="deb-analise-container">
                    <div className="deb-analise-summary-cards">
                        <div className="deb-analise-card primary">
                            <label>Rendimento Global</label>
                            <div className="value">
                                {stats.yield.toFixed(2)}%
                                <span style={{ fontSize: '0.8rem', marginLeft: '6px', color: 'var(--text-muted)' }}>Real</span>
                            </div>
                        </div>
                        <div className="deb-analise-card success">
                            <label>Peso Produzido</label>
                            <div className="value">
                                {stats.totalProduced.toLocaleString()}
                                <span style={{ fontSize: '0.8rem', marginLeft: '6px', color: 'var(--text-muted)' }}>KG</span>
                            </div>
                        </div>
                        <div className="deb-analise-card info">
                            <label>Eficiência Operacional</label>
                            <div className="value">88.5%</div>
                        </div>
                        <div className="deb-analise-card warning">
                            <label>Quebra Técnica</label>
                            <div className="value">2.1%</div>
                        </div>
                    </div>

                    <div className="deb-new-chart-card">
                        <div className="deb-new-chart-title">
                            <BarChart2 size={16} /> Rendimento por Categoria / Lote
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <BarChart data={analytics?.yieldByLot || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="lotNumber" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="yield" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals consistent with Premium System */}
            {showPieceModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <div className="header-info">
                                <h2>Gerenciar Peças e Itens</h2>
                                <p>Cadastre ou remova itens da linha de desossa</p>
                            </div>
                            <button className="close-btn" onClick={() => setShowPieceModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="filter-bar-premium" style={{ border: 'none', padding: 0, marginBottom: '24px' }}>
                                <div className="form-group-premium" style={{ flex: 2 }}>
                                    <label>Nome do Item</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Picanha China"
                                        value={newPiece.name}
                                        onChange={e => setNewPiece({ ...newPiece, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-premium" style={{ flex: 1 }}>
                                    <label>Categoria</label>
                                    <select value={newPiece.category} onChange={e => setNewPiece({ ...newPiece, category: e.target.value })}>
                                        <option value="TRASEIRO">TRASEIRO</option>
                                        <option value="DIANTEIRO">DIANTEIRO</option>
                                        <option value="PONTA_AGULHA">PA</option>
                                        <option value="OUTROS">OUTROS</option>
                                    </select>
                                </div>
                                <button className="btn-primary" onClick={handleCreatePiece} style={{ padding: '10px 20px', minWidth: 'unset' }}>
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="ivory-table">
                                    <thead>
                                        <tr>
                                            <th>Nome do Item</th>
                                            <th>Categoria</th>
                                            <th className="text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pieces.map(p => (
                                            <tr key={p._id}>
                                                <td style={{ fontWeight: 700 }}>{p.name}</td>
                                                <td><span className="status-badge-premium info">{p.category}</span></td>
                                                <td className="text-right">
                                                    <button className="btn-icon danger" onClick={() => handleDeletePiece(p._id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setShowPieceModal(false)}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}


            {showDowntimeModal && (
                <PcpDowntimeModal
                    isOpen={showDowntimeModal}
                    opId={selectedOpId || ''}
                    onClose={() => setShowDowntimeModal(false)}
                    onConfirm={handleConfirmPause}
                />
            )}
        </div>
    );
};

export default DeboningScheduleNew;
