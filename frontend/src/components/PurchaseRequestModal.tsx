import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Save } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface PurchaseRequest {
    _id?: string;
    requestNumber?: string;
    title: string;
    description: string;
    category: string;
    quantity: number;
    estimatedValue: number;
    totalValue?: number;
    department: string;
    urgency: string;
    justification: string;
    status?: string;
}

interface PurchaseRequestModalProps {
    request: PurchaseRequest | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({
    request,
    onClose,
    onSuccess
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PurchaseRequest>({
        title: request?.title || '',
        description: request?.description || '',
        category: request?.category || 'outro',
        quantity: request?.quantity || 1,
        estimatedValue: request?.estimatedValue || 0,
        department: request?.department || '',
        urgency: request?.urgency || 'media',
        justification: request?.justification || '',
        status: request?.status || 'rascunho'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'estimatedValue' ? parseFloat(value) || 0 : value
        }));
    };

    const calculateTotal = () => {
        return formData.quantity * formData.estimatedValue;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend: any = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                quantity: formData.quantity,
                estimatedValue: formData.estimatedValue,
                totalValue: calculateTotal(),
                department: formData.department,
                urgency: formData.urgency,
                justification: formData.justification
            };

            if (request?._id) {
                dataToSend.status = formData.status;
                await api.put(`/purchase-requests/${request._id}`, dataToSend);
            } else {
                await api.post('/purchase-requests', dataToSend);
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(`Erro ao salvar solicitação: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                {request ? 'Fechar' : 'Cancelar'}
            </button>
            {!request && (
                <button
                    type="submit"
                    form="purchase-form"
                    className="sfm-btn sfm-btn-primary"
                    disabled={loading}
                >
                    <Save size={18} />
                    {loading ? 'Salvando...' : 'Criar Solicitação'}
                </button>
            )}
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={request ? 'Detalhes da Solicitação' : 'Nova Solicitação de Compra'}
            icon={<ShoppingCart size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="purchase-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Título *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Ex: Compra de notebooks para equipe"
                            disabled={!!request}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Descrição *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            placeholder="Descreva detalhadamente o que precisa ser comprado"
                            disabled={!!request}
                        />
                    </div>

                    <div className="form-group">
                        <label>Categoria *</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            disabled={!!request}
                        >
                            <option value="hardware">Hardware</option>
                            <option value="software">Software</option>
                            <option value="servico">Serviço</option>
                            <option value="consumivel">Consumível</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Departamento *</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            placeholder="Ex: TI, RH, Financeiro"
                            disabled={!!request}
                        />
                    </div>

                    <div className="form-group">
                        <label>Quantidade *</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                            min="1"
                            step="1"
                            disabled={!!request}
                        />
                    </div>

                    <div className="form-group">
                        <label>Valor Unitário Estimado *</label>
                        <input
                            type="number"
                            name="estimatedValue"
                            value={formData.estimatedValue}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={!!request}
                        />
                    </div>

                    <div className="form-group">
                        <label>Urgência *</label>
                        <select
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleChange}
                            required
                            disabled={!!request}
                        >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                            <option value="critica">Crítica</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Valor Total</label>
                        <div style={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: 'var(--primary, #667eea)'
                        }}>
                            {formatCurrency(calculateTotal())}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Justificativa *</label>
                        <textarea
                            name="justification"
                            value={formData.justification}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Justifique a necessidade desta compra"
                            disabled={!!request}
                        />
                    </div>

                    {request && (user?.role === 'admin' || user?.role === 'tecnico') && (
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="rascunho">Rascunho</option>
                                <option value="aguardando_cotacao">Aguardando Cotação</option>
                                <option value="em_cotacao">Em Cotação</option>
                                <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="rejeitado">Rejeitado</option>
                                <option value="cancelado">Cancelado</option>
                                <option value="concluido">Concluído</option>
                            </select>
                        </div>
                    )}
                </div>
            </form>
        </StandardFormModal>
    );
};
