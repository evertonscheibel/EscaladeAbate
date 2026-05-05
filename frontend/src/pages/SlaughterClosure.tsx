import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    CheckCircle2,
    Unlock,
    FileSpreadsheet,
    FileText,
    GripVertical,
    Calendar,
    Plus,
    Copy,
    AlertCircle,
    Printer,
    Edit
} from 'lucide-react';

import './SlaughterClosure.css';

// No inline styles needed - moved to SlaughterClosure.css


import slaughterClosureService from '../services/slaughterClosureService';
import { SlaughterClosure, SlaughterClosureLine } from '../types/slaughterClosure';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClosureLotModal from '../components/ClosureLotModal';
import { API_URL } from '../services/api';


const SlaughterClosurePage: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const [closure, setClosure] = useState<SlaughterClosure | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<SlaughterClosureLine | null>(null);


    useEffect(() => {
        if (date) fetchClosure();
    }, [date]);

    const fetchClosure = async () => {
        try {
            setLoading(true);
            const data = await slaughterClosureService.getClosureByDate(date!);
            setClosure(data);
        } catch (error: any) {
            alert('Erro ao carregar fechamento');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFromPre = async () => {
        try {
            setSaving(true);
            const data = await slaughterClosureService.createFromPre(date!);
            setClosure(data);
            alert('Fechamento iniciado a partir da escala de abate');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao iniciar fechamento');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateLine = (index: number, field: keyof SlaughterClosureLine, value: any) => {
        if (!closure) return;
        const newLines = [...closure.lines];
        const updatedLine = { ...newLines[index], [field]: value };
        
        // Recalcular total da linha se for campo de quantidade
        if (['boi', 'vaca', 'novilha', 'bubalino', 'touro'].includes(field)) {
            updatedLine.total = (Number(updatedLine.boi) || 0) + 
                             (Number(updatedLine.vaca) || 0) + 
                             (Number(updatedLine.novilha) || 0) + 
                             (Number(updatedLine.bubalino) || 0) + 
                             (Number(updatedLine.touro) || 0);
        }
        
        newLines[index] = updatedLine;
        
        const totalCattle = newLines.reduce((sum, l) => sum + (Number(l.total) || 0), 0);
        setClosure({ ...closure, lines: newLines, totalCattle });
    };

    const handleSave = async () => {
        if (!closure) return;
        try {
            setSaving(true);
            await slaughterClosureService.updateClosure(closure._id, {
                lines: closure.lines,
                header: closure.header
            });
            alert('Rascunho salvo');
        } catch (error: any) {
            alert('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = async () => {
        if (!closure) return;
        try {
            setSaving(true);
            await slaughterClosureService.closeClosure(closure._id);
            alert('Fechamento SIF concluído e travado');
            fetchClosure();
        } catch (error: any) {
            const errorData = error.response?.data;
            if (errorData?.errors) {
                alert(`${errorData.message}\n\n${errorData.errors.join('\n')}`);
            } else {
                alert(errorData?.message || 'Erro ao fechar');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleReopen = async () => {
        if (!closure || !reopenReason) return;
        try {
            setSaving(true);
            await slaughterClosureService.reopenClosure(closure._id, reopenReason);
            alert('Fechamento reaberto para edição');
            setShowReopenModal(false);
            setReopenReason('');
            fetchClosure();
        } catch (error: any) {
            alert('Erro ao reabrir');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = async () => {
        if (!closure) return;
        try {
            const pdfRelativeUrl = await slaughterClosureService.exportPdf(closure._id);
            const fullUrl = `${API_URL.replace('/api', '')}${pdfRelativeUrl}`;
            window.open(fullUrl, '_blank');
        } catch (error) {
            alert('Erro ao gerar PDF');
        }
    };

    const handleExportExcel = async () => {
        if (!closure) return;
        try {
            // A rota de exportação no backend retorna o arquivo diretamente
            const url = `${API_URL}/slaughter-closure/${closure._id}/export`;
            window.open(url, '_blank');
        } catch (error) {
            alert('Erro ao exportar Excel');
        }
    };

    const openEditModal = (line: SlaughterClosureLine) => {
        setEditingLine(line);
        setIsEditModalOpen(true);
    };

    const handleSaveRow = async (updatedLine: SlaughterClosureLine) => {
        if (!closure) return;
        const newLines = closure.lines.map(l =>
            l.preLotRefId === updatedLine.preLotRefId ? updatedLine : l
        );
        const totalCattle = newLines.reduce((sum, l) => sum + (Number(l.total) || 0), 0);
        
        // Atualizar estado local
        const updatedClosure = { ...closure, lines: newLines, totalCattle };
        setClosure(updatedClosure);
        setIsEditModalOpen(false);
        setEditingLine(null);

        // Salvar no backend automaticamente ao fechar o modal com alterações
        try {
            setSaving(true);
            await slaughterClosureService.updateClosure(closure._id, {
                lines: newLines,
                header: closure.header
            });
            // Removido o alert de "Rascunho salvo" para ser mais fluido
        } catch (error) {
            alert('Erro ao persistir alterações do lote');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-state">Carregando fechamento...</div>;

    if (!closure) {
        return (
            <div className="empty-closure-state">
                <Calendar className="empty-icon" />
                <h3>Nenhum fechamento para {date}</h3>
                <p>O fechamento oficial SIF é gerado a partir de uma escala de abate finalizada.</p>

                <button
                    className="btn btn-primary"
                    onClick={handleCreateFromPre}
                    disabled={saving}
                >
                    {saving ? 'Iniciando...' : 'Iniciar Fechamento'}
                </button>
            </div>
        );
    }

    const isClosed = closure.status === 'CLOSED';

    return (
        <div className="closure-container">
            <header className="closure-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <ChevronLeft />
                    </button>
                    <div className="header-title">
                        <h1>
                            Fechamento Oficial SIF - {(() => {
                                if (!date) return '';
                                const [y, m, d] = date.split('-');
                                return `${d}/${m}/${y}`;
                            })()}
                        </h1>

                        <span className={`status-badge ${closure.status?.toLowerCase() || ''}`}>
                            {closure.status === 'CLOSED' ? <CheckCircle2 size={14} /> : null}
                            {closure.status === 'DRAFT' ? 'RASCUNHO' : 'FECHADO'}
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    {!isClosed ? (
                        <>
                            <button className="btn btn-outline" onClick={handleSave} disabled={saving}>
                                <Save size={18} /> Salvar Rascunho
                            </button>
                            <button className="btn btn-success" onClick={handleClose} disabled={saving}>
                                <CheckCircle2 size={18} /> Fechar SIF
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-outline" onClick={() => setShowReopenModal(true)}>
                                <Unlock size={18} /> Reabrir
                            </button>
                            <button className="btn btn-excel" onClick={handleExportExcel}>
                                <FileSpreadsheet size={18} /> Exportar XLSM
                            </button>
                            <button className="btn btn-print" onClick={handlePrint}>
                                <Printer size={18} /> Imprimir Boletim SIF
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="closure-main-info">
                <div className="info-card">
                    <label>SIF / Estabelecimento</label>
                    <input
                        type="text"
                        value={closure.header.sifNumber || ''}
                        onChange={(e) => setClosure({ ...closure, header: { ...closure.header, sifNumber: e.target.value } })}
                        disabled={isClosed}
                        placeholder="Ex: SIF 1234"
                    />
                </div>
                <div className="info-card">
                    <label>Veterinário Responsável</label>
                    <input
                        type="text"
                        value={closure.header.veterinarian || ''}
                        onChange={(e) => setClosure({ ...closure, header: { ...closure.header, veterinarian: e.target.value } })}
                        disabled={isClosed}
                        placeholder="Nome do Médico Veterinário"
                    />
                </div>
                <div className="info-card">
                    <label>Veterinário Responsável</label>
                    <input
                        type="text"
                        value={closure.header.veterinarian || ''}
                        onChange={(e) => setClosure({ ...closure, header: { ...closure.header, veterinarian: e.target.value } })}
                        disabled={isClosed}
                        placeholder="Nome do Médico Veterinário"
                    />
                </div>
                <div className="info-card totals">
                    <div className="total-item">
                        <span className="label">Total Geral</span>
                        <span className="value">{closure.totalCattle} Cabeças</span>
                    </div>
                </div>
            </div>

            <div className="closure-table-container">
                <table className="closure-table">
                    <thead>
                        <tr>
                            <th className="col-drag"></th>
                            <th className="col-edit"></th>
                            <th className="col-seq">Seq</th>
                            <th className="col-rancher">Produtor</th>
                            <th className="col-local">Cidade/UF</th>
                            <th className="col-cattle">Qtde</th>
                            <th className="col-curral">Curral</th>
                            <th className="col-cor">Capa/Cor</th>
                            <th className="col-nf">NF/GTA</th>
                            <th className="col-obs">Observações</th>
                            <th className="col-actions"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {closure.lines.map((line, idx) => (
                            <tr key={line.preLotRefId}>
                                <td className="col-drag"><GripVertical size={16} /></td>
                                <td className="col-edit">
                                    <button
                                        className="btn-icon-mini"
                                        onClick={() => openEditModal(line)}
                                        title="Editar Lançamento"
                                    >
                                        <Edit size={14} />
                                    </button>
                                </td>
                                <td className="col-seq">{line.sequence}</td>
                                <td className="col-rancher">
                                    <span className="producer-name">{line.producerName}</span>
                                    {line.brokerName && <span className="broker-name">{line.brokerName}</span>}
                                </td>
                                <td className="col-local">
                                    <div className="stack-inputs">
                                        <input
                                            type="text"
                                            value={line.municipio || ''}
                                            onChange={(e) => handleUpdateLine(idx, 'municipio', e.target.value)}
                                            disabled={isClosed}
                                            placeholder="Cidade"
                                        />
                                        <input
                                            type="text"
                                            value={line.uf || ''}
                                            onChange={(e) => handleUpdateLine(idx, 'uf', e.target.value.substring(0, 2).toUpperCase())}
                                            disabled={isClosed}
                                            placeholder="UF"
                                            className="input-uf"
                                            maxLength={2}
                                        />
                                    </div>
                                </td>
                                <td className="col-cattle">
                                    <div className="cattle-summary">
                                        <span className="total-main">{line.total}</span>
                                        <small>B:{line.boi} V:{line.vaca} N:{line.novilha}</small>
                                    </div>
                                </td>
                                <td className="col-curral">
                                    <input
                                        type="text"
                                        value={line.curral || ''}
                                        onChange={(e) => handleUpdateLine(idx, 'curral', e.target.value)}
                                        disabled={isClosed}
                                        placeholder="C-01"
                                    />
                                </td>
                                <td className="col-cor">
                                    <input
                                        type="text"
                                        value={line.cor || ''}
                                        onChange={(e) => handleUpdateLine(idx, 'cor', e.target.value)}
                                        disabled={isClosed}
                                    />
                                </td>
                                <td className="col-nf">
                                    <div className="stack-inputs">
                                        <input
                                            type="text"
                                            value={line.nf || ''}
                                            onChange={(e) => handleUpdateLine(idx, 'nf', e.target.value)}
                                            placeholder="NF"
                                            disabled={isClosed}
                                        />
                                        <input
                                            type="text"
                                            value={line.gta || ''}
                                            onChange={(e) => handleUpdateLine(idx, 'gta', e.target.value)}
                                            placeholder="GTA"
                                            disabled={isClosed}
                                        />
                                    </div>
                                </td>
                                <td className="col-obs">
                                    <textarea
                                        value={line.observations || ''}
                                        onChange={(e) => handleUpdateLine(idx, 'observations', e.target.value)}
                                        disabled={isClosed}
                                    />
                                </td>
                                <td className="col-actions">
                                    {!isClosed && (
                                        <button 
                                            className="btn-save-row" 
                                            onClick={handleSave}
                                            title="Finalizar Edição deste Lote"
                                        >
                                            <CheckCircle2 size={16} />
                                            <span>OK</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showReopenModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Reabrir Fechamento</h2>
                        <p>A reabertura permitirá editar os dados novamente. Informe o motivo para auditoria.</p>
                        <textarea
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder="Motivo da reabertura..."
                        />
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowReopenModal(false)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={handleReopen} disabled={!reopenReason}>Confirmar Reabertura</button>
                        </div>
                    </div>
                </div>
            )}

            {editingLine && (
                <ClosureLotModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveRow}
                    line={editingLine}
                />
            )}
        </div>
    );
};

export default SlaughterClosurePage;
