import React, { useState } from 'react';
import api from '../services/api';
import { Package, Save, Tag, Info, Building } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface CreateAssetModalProps {
    requestId: string;
    requestNumber: string;
    requestTitle: string;
    requestValue: number;
    requestDepartment: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
    requestId,
    requestNumber,
    requestTitle,
    requestValue,
    requestDepartment,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: requestTitle,
        type: 'outro',
        brand: '',
        model: '',
        serialNumber: '',
        location: '',
        warrantyExpiration: '',
        assignedTo: '',
        notes: `Criado a partir da solicitação ${requestNumber}`
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post(
                `/purchase-requests/${requestId}/create-asset`,
                formData
            );

            alert(`Ativo criado com sucesso! ID: ${response.data.data.assetId}`);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao criar ativo:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
            alert(`Erro ao criar ativo: ${errorMessage}`);
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
                form="create-asset-app-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Criando...' : 'Criar Ativo'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title="Criar Ativo do Patrimônio"
            icon={<Package size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="create-asset-app-form" onSubmit={handleSubmit}>
                <div style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Solicitação</span>
                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{requestNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Departamento</span>
                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{requestDepartment}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor</span>
                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(requestValue)}</strong>
                    </div>
                </div>

                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Tag size={18} /> Dados do Ativo</h3>
                    <div className="sfm-form-grid">
                        <div className="sfm-form-group sfm-full-width">
                            <label>Descrição Detalhada *</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                placeholder="Ex: Notebook Dell Latitude 5420"
                            />
                        </div>

                        <div className="sfm-form-group">
                            <label>Tipo de Ativo *</label>
                            <select name="type" value={formData.type} onChange={handleChange} required>
                                <option value="notebook">Notebook</option>
                                <option value="desktop">Desktop</option>
                                <option value="monitor">Monitor</option>
                                <option value="impressora">Impressora</option>
                                <option value="servidor">Servidor</option>
                                <option value="rede">Equipamento de Rede</option>
                                <option value="periferico">Periférico</option>
                                <option value="software">Software</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>

                        <div className="sfm-form-group">
                            <label>Marca / Fabricante</label>
                            <input
                                type="text"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                placeholder="Ex: Dell, HP, Lenovo"
                            />
                        </div>

                        <div className="sfm-form-group">
                            <label>Modelo</label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="Ex: Latitude 5420"
                            />
                        </div>

                        <div className="sfm-form-group">
                            <label>Número de Série</label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleChange}
                                placeholder="Ex: SN123456789"
                            />
                        </div>
                    </div>
                </div>

                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Building size={18} /> Localização e Garantia</h3>
                    <div className="sfm-form-grid">
                        <div className="sfm-form-group">
                            <label>Localização Inicial</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Ex: Sala 201, TI"
                            />
                        </div>

                        <div className="sfm-form-group">
                            <label>Vencimento Garantia</label>
                            <input
                                type="date"
                                name="warrantyExpiration"
                                value={formData.warrantyExpiration}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Info size={18} /> Observações</h3>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Informações adicionais rastreáveis..."
                    />
                </div>
            </form>
        </StandardFormModal>
    );
};
