import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Plus,
    Play,
    CheckCircle2,
    Clock,
    Calculator,
    GripVertical,
    Edit2,
    Trash2,
    Printer
} from 'lucide-react';



import './DeboningSchedule.css';
import deboningService from '../services/deboningService';
import { API_URL } from '../services/api';


interface AnimalBreakdown {
    traseiro: number;
    dianteiro: number;
    ponta: number;
    cupim: number;
}

interface LotFormData {
    lotNumber?: number;
    origin: string;
    boi: number;
    vaca: number;
    novilha: number;
    bubalino: number;
    touro: number;
    breakdown: {
        boi: AnimalBreakdown;
        vaca: AnimalBreakdown;
        novilha: AnimalBreakdown;
        bubalino: AnimalBreakdown;
        touro: AnimalBreakdown;
    };
}



const DeboningSchedulePage: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showLotModal, setShowLotModal] = useState(false);
    const [editingLotId, setEditingLotId] = useState<string | null>(null);

    const [formData, setFormData] = useState<LotFormData>({
        origin: '',
        boi: 0,
        vaca: 0,
        novilha: 0,
        bubalino: 0,
        touro: 0,
        breakdown: {
            boi: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
            vaca: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
            novilha: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
            bubalino: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
            touro: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 }
        }
    });



    useEffect(() => {
        if (date) fetchSchedule();
    }, [date]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const data = await deboningService.getScheduleByDate(date!);
            setSchedule(data);

        } catch (error) {
            alert('Erro ao buscar programação');
        } finally {

            setLoading(false);
        }
    };

    const handleImportSlaughter = async () => {
        if (!schedule) return;
        try {
            // Supondo que importamos do mesmo dia
            await deboningService.importFromSlaughter(schedule._id, date!);
            alert('Importado do abate');
            fetchSchedule();
        } catch (error) {
            alert('Nenhuma escala de abate fechada para este dia');
        }

    };

    const handleAnimalChange = (type: string, quantity: number) => {
        setFormData(prev => ({
            ...prev,
            [type]: quantity,
            breakdown: {
                ...prev.breakdown,
                [type]: {
                    ...prev.breakdown[type as keyof LotFormData['breakdown']],
                    traseiro: quantity * 2,
                    dianteiro: quantity * 2,
                    ponta: quantity * 2
                }
            }
        }));
    };

    const handlePartChange = (animalType: string, part: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            breakdown: {
                ...prev.breakdown,
                [animalType]: {
                    ...prev.breakdown[animalType as keyof LotFormData['breakdown']],
                    [part]: value
                }
            }
        }));
    };

    const handleEditLot = (lot: any) => {
        setEditingLotId(lot._id);
        setFormData({
            origin: lot.origin,
            boi: lot.boi || 0,
            vaca: lot.vaca || 0,
            novilha: lot.novilha || 0,
            bubalino: lot.bubalino || 0,
            touro: lot.touro || 0,
            breakdown: lot.breakdown || {
                boi: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                vaca: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                novilha: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                bubalino: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                touro: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 }
            }
        });
        setShowLotModal(true);
    };

    const handleSaveLot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedule) return;

        try {
            if (editingLotId) {
                await deboningService.updateLot(editingLotId, formData);
                alert('Lote atualizado com sucesso');
            } else {
                await deboningService.createLot(schedule._id, formData);
                alert('Lote criado com sucesso');
            }
            setShowLotModal(false);
            setEditingLotId(null);
            setFormData({
                origin: '',
                boi: 0,
                vaca: 0,
                novilha: 0,
                bubalino: 0,
                touro: 0,
                breakdown: {
                    boi: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                    vaca: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                    novilha: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                    bubalino: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 },
                    touro: { traseiro: 0, dianteiro: 0, ponta: 0, cupim: 0 }
                }
            });
            fetchSchedule();
        } catch (error) {
            alert('Erro ao salvar lote');
        }
    };

    const handleDeleteLot = async (id: string) => {
        if (!window.confirm('Deseja excluir este lote?')) return;
        try {
            await deboningService.deleteLot(id);
            fetchSchedule();
        } catch (error) {
            alert('Erro ao excluir lote');
        }
    };

    const handleExportPdf = async () => {
        if (!schedule) return;
        try {
            const data = await deboningService.exportToPdf(schedule._id);
            if (data.pdfUrl) {
                // Abrir em nova aba
                // Usar API_URL removendo o sufixo /api para pegar a base do servidor
                const serverBase = API_URL.replace('/api', '');
                const url = data.pdfUrl.startsWith('http') ? data.pdfUrl : `${serverBase}${data.pdfUrl}`;
                window.open(url, '_blank');
            }

        } catch (error) {
            alert('Erro ao gerar PDF');
        }
    };





    if (loading) return <div>Carregando...</div>;

    return (
        <div className="deboning-container">
            <header className="page-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/pcp')}>
                        <ChevronLeft />
                    </button>
                    <h1>Programação de Desossa - {date}</h1>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleExportPdf}>
                        <Printer size={18} /> Imprimir PDF
                    </button>
                    <button className="btn btn-outline" onClick={handleImportSlaughter}>
                        <Clock size={18} /> Importar do Abate
                    </button>

                    <button className="btn btn-success">
                        <Play size={18} /> Iniciar Desossa
                    </button>
                </div>
            </header>

            <div className="lots-section">
                <div className="section-header">
                    <h3>Lotes Programados</h3>
                    <button
                        className="btn btn-primary sm"
                        onClick={() => setShowLotModal(true)}
                    >
                        <Plus size={14} /> Novo Lote
                    </button>
                </div>


                <table className="deboning-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Lote</th>
                            <th>Origem</th>
                            <th>Total</th>
                            <th>Previsão Início</th>
                            <th>Fim</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule?.lots?.map((lot: any) => (
                            <tr key={lot._id}>
                                <td><GripVertical size={14} /></td>
                                <td>{lot.lotNumber}</td>
                                <td>{lot.origin}</td>
                                <td>{lot.totalCarcassas}</td>
                                <td>{lot.startTime}</td>
                                <td>{lot.endTime}</td>
                                <td>
                                    <span className={`status-tag ${(lot.lotStatus || 'PENDENTE').toLowerCase()}`}>
                                        {lot.lotStatus || 'PENDENTE'}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button className="btn-icon" onClick={() => handleEditLot(lot)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDeleteLot(lot._id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>


                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Novo Lote */}
            {showLotModal && (
                <div className="modal-overlay" onClick={() => setShowLotModal(false)}>
                    <div className="lot-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingLotId ? 'Editar Lote' : 'Novo Lote de Desossa'}</h3>
                            <button className="btn-close" onClick={() => {
                                setShowLotModal(false);
                                setEditingLotId(null);
                            }}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveLot}>
                            <div className="form-group">
                                <label>Origem / Pecuarista</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.origin}
                                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    placeholder="Ex: Fazenda Santa Maria"
                                />
                            </div>

                            <div className="breakdown-grid-header">
                                <span>Tipo</span>
                                <span>Qtd (Animais)</span>
                                <span>Traseiro</span>
                                <span>Dianteiro</span>
                                <span>Ponta</span>
                                <span>Cupim</span>
                            </div>

                            {['boi', 'vaca', 'novilha', 'bubalino', 'touro'].map(type => (
                                <div key={type} className="breakdown-row">
                                    <label className="type-label">{type.toUpperCase()}</label>
                                    <input
                                        type="number"
                                        className="qty-input"
                                        value={formData[type as keyof LotFormData] as number}
                                        onChange={e => handleAnimalChange(type, parseInt(e.target.value) || 0)}
                                    />
                                    <input
                                        type="number"
                                        value={formData.breakdown[type as keyof LotFormData['breakdown']].traseiro}
                                        onChange={e => handlePartChange(type, 'traseiro', parseInt(e.target.value) || 0)}
                                    />
                                    <input
                                        type="number"
                                        value={formData.breakdown[type as keyof LotFormData['breakdown']].dianteiro}
                                        onChange={e => handlePartChange(type, 'dianteiro', parseInt(e.target.value) || 0)}
                                    />
                                    <input
                                        type="number"
                                        value={formData.breakdown[type as keyof LotFormData['breakdown']].ponta}
                                        onChange={e => handlePartChange(type, 'ponta', parseInt(e.target.value) || 0)}
                                    />
                                    <input
                                        type="number"
                                        value={formData.breakdown[type as keyof LotFormData['breakdown']].cupim}
                                        onChange={e => handlePartChange(type, 'cupim', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            ))}

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => {
                                    setShowLotModal(false);
                                    setEditingLotId(null);
                                }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingLotId ? 'Atualizar Lote' : 'Salvar Lote'}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}
        </div>

    );
};

export default DeboningSchedulePage;
