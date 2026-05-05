import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, RefreshCw, Lock, Unlock, Download,
    Plus, Edit2, Trash2, Clock
} from 'lucide-react';
import { slaughterService, API_URL } from '../services';
import { SlaughterSchedule as ISlaughterSchedule, SlaughterLot } from '../types/slaughter';
import { RancherAutocomplete } from '../components/RancherAutocomplete';
import { CreateRancherModal } from '../components/CreateRancherModal';
import { StandardFormModal } from '../components/StandardFormModal';
import './SlaughterSchedule.css';


export const SlaughterSchedule: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState<ISlaughterSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingLot, setEditingLot] = useState<Partial<SlaughterLot> | null>(null);
    const [showCreateRancher, setShowCreateRancher] = useState(false);
    const [newRancherName, setNewRancherName] = useState('');
    const [localStartTime, setLocalStartTime] = useState('');
    const [localRate, setLocalRate] = useState('');

    const initialNewLot = {
        lotNumber: 1,
        rancherName: '',
        brokerNumber: '',
        boi: 0,
        vaca: 0,
        novilha: 0,
        bubalino: 0
    };
    const [newLot, setNewLot] = useState<Partial<SlaughterLot>>(initialNewLot);

    useEffect(() => {
        loadSchedule();
    }, [date]);

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
            hours = hours.padStart(2, '0');
            minutes = minutes.padEnd(2, '0').slice(0, 2);
            clean = `${hours}:${minutes}`;
        }

        return clean;
    };

    const loadSchedule = async () => {
        if (!date) return;

        setLoading(true);
        try {
            const data = await slaughterService.getScheduleByDate(date);
            setSchedule(data);
            setLocalStartTime(data.startTime);
            setLocalRate(data.rateHeadsPerHour.toString());
            // Atualizar número do próximo lote
            setNewLot(prev => ({
                ...prev,
                lotNumber: (data.lots.length || 0) + 1
            }));
        } catch (error) {
            console.error('Erro ao carregar escala:', error);
            alert('Erro ao carregar escala');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStartTime = async (newTime: string) => {
        if (!schedule) return;

        // Validar formato HH:mm
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(newTime)) {
            alert('Formato de hora inválido. Use HH:mm (ex: 07:00)');
            setLocalStartTime(schedule.startTime); // Reset to last valid
            return;
        }

        try {
            await slaughterService.updateSchedule(schedule._id, { startTime: newTime });
            await loadSchedule();
        } catch (error) {
            console.error('Erro ao atualizar hora:', error);
            alert('Erro ao atualizar hora de início');
        }
    };

    const handleUpdateRate = async (newRateStr: string) => {
        if (!schedule) return;

        const newRate = parseInt(newRateStr);
        if (isNaN(newRate) || newRate < 1) {
            alert('Taxa de abate deve ser pelo menos 1');
            setLocalRate(schedule.rateHeadsPerHour.toString());
            return;
        }

        try {
            await slaughterService.updateSchedule(schedule._id, { rateHeadsPerHour: newRate });
            await loadSchedule();
        } catch (error) {
            console.error('Erro ao atualizar taxa:', error);
            alert('Erro ao atualizar taxa de abate');
        }
    };

    const handleSaveLot = async (lotData: Partial<SlaughterLot>, isUpdate: boolean) => {
        if (!schedule) return;

        if (!lotData.rancherName || !lotData.brokerNumber) {
            alert('Preencha os campos obrigatórios (Pecuarista e Corretor)');
            return;
        }

        const total = (lotData.boi || 0) + (lotData.vaca || 0) + (lotData.novilha || 0) + (lotData.bubalino || 0);
        if (total === 0) {
            alert('O total de cabeças deve ser maior que zero');
            return;
        }

        try {
            if (isUpdate && lotData._id) {
                await slaughterService.updateLot(lotData._id, lotData);
                setEditingLot(null);
            } else {
                await slaughterService.createLot(schedule._id, lotData);
                // Reset new lot state
                setNewLot({
                    ...initialNewLot,
                    lotNumber: (schedule.lots.length || 0) + 2
                });
            }

            await loadSchedule();
        } catch (error: any) {
            console.error('Erro ao salvar lote:', error);
            alert(error.response?.data?.message || 'Erro ao salvar lote');
        }
    };

    const handleDeleteLot = async (lotId: string) => {
        if (!confirm('Deseja realmente excluir este lote?')) return;

        try {
            await slaughterService.deleteLot(lotId);
            await loadSchedule();
        } catch (error) {
            console.error('Erro ao excluir lote:', error);
            alert('Erro ao excluir lote');
        }
    };

    const handleRecalculate = async () => {
        if (!schedule) return;

        try {
            await slaughterService.recalculate(schedule._id);
            await loadSchedule();
        } catch (error) {
            console.error('Erro ao recalcular:', error);
            alert('Erro ao recalcular horários');
        }
    };

    const handleClose = async () => {
        if (!schedule) return;

        if (!confirm('Deseja fechar esta escala? Ela ficará bloqueada para edição.')) return;

        try {
            const closed = await slaughterService.close(schedule._id);
            setSchedule(closed);
            alert('Escala fechada com sucesso!');
        } catch (error: any) {
            console.error('Erro ao fechar:', error);
            alert(error.response?.data?.message || 'Erro ao fechar escala');
        }
    };

    const handleReopen = async () => {
        if (!schedule) return;

        if (!confirm('Deseja reabrir esta escala para edição?')) return;

        try {
            await slaughterService.reopen(schedule._id);
            await loadSchedule();
            alert('Escala reaberta!');
        } catch (error) {
            console.error('Erro ao reabrir:', error);
            alert('Erro ao reabrir escala');
        }
    };

    const handleDownloadPDF = async () => {
        if (!schedule?.pdfUrl) return;

        try {
            const baseUrl = API_URL.replace(/\/api$/, '');
            const response = await fetch(`${baseUrl}${schedule.pdfUrl}`);

            if (!response.ok) {
                throw new Error('Erro ao baixar PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `escala-${date}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar PDF');
        }
    };

    const isDraft = schedule?.status === 'DRAFT';
    const dateFormatted = date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR') : '';

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    if (!schedule) {
        return <div className="error">Escala não encontrada</div>;
    }

    return (
        <div className="slaughter-schedule">
            <div className="schedule-header">
                <div className="header-top">
                    <div className="header-left">
                        <button className="btn-back" onClick={() => navigate('/slaughter')}>
                            <ArrowLeft size={20} />
                            Voltar
                        </button>
                    </div>

                    <div className="header-title">
                        <h1>Escala de Abate - {dateFormatted}</h1>
                        <div className={`status-badge ${schedule.status.toLowerCase()}`}>
                            {schedule.status === 'DRAFT' ? (
                                <><Edit2 size={16} /> Rascunho</>
                            ) : (
                                <><Lock size={16} /> Fechada</>
                            )}
                        </div>
                    </div>

                    <div className="header-actions">
                        {isDraft ? (
                            <>
                                <button className="btn-secondary" onClick={handleRecalculate}>
                                    <RefreshCw size={18} />
                                    Recalcular
                                </button>
                                <button className="btn-primary" onClick={handleClose}>
                                    <Lock size={18} />
                                    Fechar Escala
                                </button>
                            </>
                        ) : (
                            <>
                                {schedule.pdfUrl && (
                                    <button
                                        className="btn-secondary"
                                        onClick={handleDownloadPDF}
                                    >
                                        <Download size={18} />
                                        Baixar PDF
                                    </button>
                                )}
                                <button className="btn-warning" onClick={handleReopen}>
                                    <Unlock size={18} />
                                    Reabrir
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="header-bottom">
                    <div className="header-info-inputs">
                        <div className="info-item">
                            <label>Hora de Início:</label>
                            {isDraft ? (
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
                                            const formatted = formatTime(localStartTime);
                                            setLocalStartTime(formatted);
                                            handleUpdateStartTime(formatted);
                                        }
                                    }}
                                    className="header-time-input"
                                    placeholder="07:00"
                                />
                            ) : (
                                <span className="time-display">{schedule.startTime}</span>
                            )}
                        </div>

                        <div className="info-item">
                            <label><Clock size={20} /> Taxa de Abate (cabs/h):</label>
                            {isDraft ? (
                                <input
                                    type="text"
                                    value={localRate}
                                    onChange={(e) => setLocalRate(e.target.value)}
                                    onBlur={(e) => handleUpdateRate(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateRate(localRate)}
                                    className="header-rate-input"
                                />
                            ) : (
                                <span className="rate-display">{schedule.rateHeadsPerHour} cabeças/hora</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="schedule-content">

                <div className="lots-section">
                    <div className="lots-header">
                        <h2>Lotes</h2>
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
                                    <th className="total-col-header num-col">Total</th>
                                    <th className="num-col">Início</th>
                                    <th className="num-col">Duração</th>
                                    <th className="num-col">Fim</th>
                                    {isDraft && <th className="num-col">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.lots.map(lot => (
                                    <tr key={lot._id}>
                                        <td className="num-col">{lot.lotNumber}</td>
                                        <td>{lot.rancherName}</td>
                                        <td className="num-col">{lot.brokerNumber}</td>
                                        <td className="qty-col">{lot.boi}</td>
                                        <td className="qty-col">{lot.vaca}</td>
                                        <td className="qty-col">{lot.novilha}</td>
                                        <td className="qty-col">{lot.bubalino || 0}</td>
                                        <td className="total-col">{lot.total}</td>
                                        <td className="time-col">{lot.startTime}</td>
                                        <td className="duration-col">{lot.durationMinutes} min</td>
                                        <td className="time-col">{lot.endTime}</td>
                                        {isDraft && (
                                            <td className="actions-col">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setEditingLot(lot)}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDeleteLot(lot._id!)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                {isDraft && (
                                    <tr className="new-lot-row">
                                        <td>
                                            <input
                                                type="number"
                                                value={newLot.lotNumber || ''}
                                                onChange={(e) => setNewLot({ ...newLot, lotNumber: parseInt(e.target.value) || 0 })}
                                                className="inline-input-small"
                                            />
                                        </td>
                                        <td>
                                            <RancherAutocomplete
                                                value={newLot.rancherName || ''}
                                                onChange={(name, id) => setNewLot({
                                                    ...newLot,
                                                    rancherName: name,
                                                    rancher: id ? { _id: id } as any : undefined
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
                                                value={newLot.brokerNumber || ''}
                                                onChange={(e) => setNewLot({ ...newLot, brokerNumber: e.target.value })}
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
                                        <td className="total-col">
                                            {(newLot.boi || 0) + (newLot.vaca || 0) + (newLot.novilha || 0) + (newLot.bubalino || 0)}
                                        </td>
                                        <td colSpan={3} className="info-col">Pressione o botão para adicionar</td>
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
                            </tbody>
                        </table>
                    </div>
                </div>

                {schedule.lots.length > 0 && (
                    <div className="totals-card">
                        <h3>Totais</h3>
                        <div className="totals-grid">
                            <div className="total-item">
                                <span className="total-label">Boi:</span>
                                <span className="total-value">{schedule.totalBoi}</span>
                            </div>
                            <div className="total-item">
                                <span className="total-label">Vaca:</span>
                                <span className="total-value">{schedule.totalVaca}</span>
                            </div>
                            <div className="total-item">
                                <span className="total-label">Novilha:</span>
                                <span className="total-value">{schedule.totalNovilha}</span>
                            </div>
                            <div className="total-item">
                                <span className="total-label">Bubalino:</span>
                                <span className="total-value">{schedule.totalBubalino || 0}</span>
                            </div>
                            <div className="total-item grand-total">
                                <span className="total-label">Total Geral:</span>
                                <span className="total-value">{schedule.totalCattle}</span>
                            </div>
                        </div>
                    </div>
                )}
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
                            <label>Nº do Lote *</label>
                            <input
                                type="number"
                                value={editingLot.lotNumber || ''}
                                onChange={(e) => setEditingLot({
                                    ...editingLot,
                                    lotNumber: parseInt(e.target.value) || 0
                                })}
                                min="1"
                            />
                        </div>

                        <div className="form-group rancher-field-group">
                            <label>Pecuarista *</label>
                            <RancherAutocomplete
                                value={editingLot.rancherName || ''}
                                onChange={(name, id) => setEditingLot({
                                    ...editingLot,
                                    rancherName: name,
                                    rancher: id ? { _id: id } as any : undefined
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
                                value={editingLot.brokerNumber || ''}
                                onChange={(e) => setEditingLot({
                                    ...editingLot,
                                    brokerNumber: e.target.value
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
                                rancherName: rancher.name,
                                rancher: rancher as any
                            });
                        } else {
                            setNewLot({
                                ...newLot,
                                rancherName: rancher.name,
                                rancher: rancher as any
                            });
                        }
                        setShowCreateRancher(false);
                    }}
                />
            )}
        </div>
    );
};
