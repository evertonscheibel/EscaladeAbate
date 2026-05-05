import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../services';
import { Wrench, Plus, Trash2, Save, Calendar, Clock, PenTool } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface MaintenanceModalProps {
    maintenance: any | null;
    assetId: string;
    onClose: () => void;
    onSave: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ maintenance, assetId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        asset: assetId,
        type: 'preventiva',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        scheduledDate: '',
        status: 'agendada',
        priority: 'media',
        responsible: '',
        technician: '',
        laborCost: 0,
        notes: '',
        relatedTicket: ''
    });

    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (maintenance) {
            setFormData({
                asset: maintenance.asset?._id || assetId,
                type: maintenance.type || 'preventiva',
                title: maintenance.title || '',
                description: maintenance.description || '',
                startDate: maintenance.startDate ? maintenance.startDate.split('T')[0] : '',
                endDate: maintenance.endDate ? maintenance.endDate.split('T')[0] : '',
                scheduledDate: maintenance.scheduledDate ? maintenance.scheduledDate.split('T')[0] : '',
                status: maintenance.status || 'agendada',
                priority: maintenance.priority || 'media',
                responsible: maintenance.responsible?._id || '',
                technician: maintenance.technician?._id || '',
                laborCost: maintenance.laborCost || 0,
                notes: maintenance.notes || '',
                relatedTicket: maintenance.relatedTicket?._id || ''
            });
            setParts(maintenance.parts || []);
        }
    }, [maintenance, assetId]);

    const addPart = () => {
        setParts([...parts, { name: '', partNumber: '', quantity: 1, unitCost: 0, supplier: '' }]);
    };

    const removePart = (index: number) => {
        setParts(parts.filter((_, i) => i !== index));
    };

    const updatePart = (index: number, field: string, value: any) => {
        const newParts = [...parts];
        newParts[index] = { ...newParts[index], [field]: value };
        setParts(newParts);
    };

    const calculateTotalCost = () => {
        const partsCost = parts.reduce((total, part) => total + (part.quantity * part.unitCost), 0);
        return partsCost + (formData.laborCost || 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = { ...formData, parts };

            if (maintenance) {
                await maintenanceService.update(maintenance._id, dataToSend);
            } else {
                await maintenanceService.create(dataToSend);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar manutenção:', error);
            alert('Erro ao salvar manutenção');
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button
                type="submit"
                form="maintenance-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Salvando...' : maintenance ? 'Atualizar Manutenção' : 'Criar Manutenção'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={maintenance ? 'Editar Manutenção' : 'Nova Manutenção'}
            icon={<Wrench size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="maintenance-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Tipo *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            <option value="preventiva">Preventiva</option>
                            <option value="corretiva">Corretiva</option>
                            <option value="preditiva">Preditiva</option>
                            <option value="emergencial">Emergencial</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Prioridade</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                            <option value="critica">Crítica</option>
                        </select>
                    </div>

                    <div className="form-group full-width">
                        <label>Título / Resumo *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Ex: Troca de SSD / Limpeza Preventiva"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Descrição Detalhada *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            placeholder="Descreva a manutenção técnica..."
                        />
                    </div>
                </div>

                <div className="sfm-section-card" style={{ marginTop: '24px' }}>
                    <h3 className="sfm-section-title"><Calendar size={18} /> Agendamento e Datas</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Data Agendada</label>
                            <input
                                type="date"
                                value={formData.scheduledDate}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="agendada">Agendada</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="concluida">Concluída</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Data de Início</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Data de Conclusão</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="sfm-section-card" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="sfm-section-title" style={{ marginBottom: 0 }}><PenTool size={18} /> Peças e Peças de Reposição</h3>
                        <button type="button" className="sfm-btn sfm-btn-secondary" onClick={addPart} style={{ height: '32px', fontSize: '13px' }}>
                            <Plus size={14} /> Adicionar Peça
                        </button>
                    </div>

                    {parts.map((part, index) => (
                        <div key={index} style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1.5fr 0.8fr 1fr auto',
                            gap: '10px',
                            marginBottom: '10px',
                            padding: '12px',
                            background: 'var(--surface, #f8fafc)',
                            borderRadius: '10px',
                            border: '1px solid var(--border, #e2e8f0)'
                        }}>
                            <input type="text" placeholder="Nome da peça" value={part.name} onChange={(e) => updatePart(index, 'name', e.target.value)} />
                            <input type="text" placeholder="Part No." value={part.partNumber} onChange={(e) => updatePart(index, 'partNumber', e.target.value)} />
                            <input type="number" placeholder="Qtd" value={part.quantity} onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)} />
                            <input type="number" step="0.01" placeholder="R$ Unit" value={part.unitCost} onChange={(e) => updatePart(index, 'unitCost', parseFloat(e.target.value) || 0)} />
                            <button type="button" className="sfm-close-btn" onClick={() => removePart(index)} style={{ width: '30px', height: '30px' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <div className="form-grid" style={{ marginTop: '16px' }}>
                        <div className="form-group">
                            <label>Custo de Mão de Obra (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.laborCost}
                                onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            padding: '12px',
                            background: '#f0f9ff',
                            borderRadius: '10px',
                            border: '1px solid #bae6fd'
                        }}>
                            <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>CUSTO TOTAL CALCULADO</span>
                            <strong style={{ fontSize: '20px', color: '#0369a1' }}>R$ {calculateTotalCost().toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

                <div className="sfm-section-card" style={{ marginTop: '24px' }}>
                    <h3 className="sfm-section-title"><Clock size={18} /> Observações Técnicas</h3>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Informações adicionais sobre o serviço realizado..."
                        rows={3}
                    />
                </div>
            </form>
        </StandardFormModal>
    );
};
