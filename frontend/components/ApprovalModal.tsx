import React, { useState } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface ApprovalModalProps {
    requestId: string;
    requestNumber: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    requestId,
    requestNumber,
    onClose,
    onSuccess
}) => {
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (selectedAction: 'aprovar' | 'rejeitar') => {
        if (!comments.trim()) {
            alert('Por favor, adicione um comentário explicando sua decisão.');
            return;
        }

        setLoading(true);

        try {
            await api.post(
                `/purchase-requests/${requestId}/approve`,
                { action: selectedAction, comments }
            );

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao processar aprovação:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
            alert(`Erro: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    className="sfm-btn sfm-btn-danger"
                    onClick={() => handleSubmit('rejeitar')}
                    disabled={loading || !comments.trim()}
                    style={{ background: '#ef4444' }}
                >
                    <XCircle size={18} />
                    Reprovar
                </button>
                <button
                    className="sfm-btn sfm-btn-primary"
                    onClick={() => handleSubmit('aprovar')}
                    disabled={loading || !comments.trim()}
                >
                    <CheckCircle size={18} />
                    Aprovar
                </button>
            </div>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title="Aprovação de Solicitação"
            icon={<AlertCircle size={22} />}
            size="sm"
            footer={footerContent}
        >
            <div style={{
                padding: '16px',
                background: '#f0f9ff',
                borderRadius: '10px',
                border: '1px solid #bae6fd',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Solicitação em análise</span>
                <strong style={{ fontSize: '18px', color: '#0c4a6e' }}>#{requestNumber}</strong>
            </div>

            <div className="form-group">
                <label>Comentários / Justificativa *</label>
                <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Explique o motivo da sua decisão (mínimo de 10 caracteres)..."
                    rows={5}
                    required
                />
            </div>
        </StandardFormModal>
    );
};
