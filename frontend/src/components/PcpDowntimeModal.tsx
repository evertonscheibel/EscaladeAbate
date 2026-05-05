import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Save } from 'lucide-react';
import './PcpDowntimeModal.css';
import deboningService from '../services/deboningService';

interface PcpDowntimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { motivoParadaId: string; observacao: string }) => void;
    opId: string;
}

export const PcpDowntimeModal: React.FC<PcpDowntimeModalProps> = ({ isOpen, onClose, onConfirm, opId }) => {
    const [motivos, setMotivos] = useState<any[]>([]);
    const [selectedMotivo, setSelectedMotivo] = useState('');
    const [observacao, setObservacao] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMotivos();
        }
    }, [isOpen]);

    const loadMotivos = async () => {
        try {
            // Mocking or fetching from service
            const response = await deboningService.getDowntimeReasons();
            setMotivos(response || []);
        } catch (err) {
            console.error('Erro ao carregar motivos de parada');
        }
    };

    const handleConfirm = () => {
        if (!selectedMotivo) {
            alert('Selecione um motivo');
            return;
        }
        onConfirm({ motivoParadaId: selectedMotivo, observacao });
    };

    if (!isOpen) return null;

    return (
        <div className="pcp-modal-overlay">
            <div className="pcp-modal-content">
                <header className="pcp-modal-header">
                    <div className="pcp-modal-title">
                        <AlertTriangle className="text-warning" size={24} />
                        <h2>Registrar Parada de OP</h2>
                    </div>
                    <button className="pcp-modal-close" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="pcp-modal-body">
                    <p className="pcp-modal-hint">A Ordem de Produção será pausada. Por favor, especifique o motivo técnico ou operacional desta interrupção.</p>

                    <div className="pcp-form-group">
                        <label>Motivo da Interrupção</label>
                        <select
                            value={selectedMotivo}
                            onChange={(e) => setSelectedMotivo(e.target.value)}
                            className="pcp-select"
                        >
                            <option value="">Selecione o motivo...</option>
                            {motivos.map(m => (
                                <option key={m._id} value={m._id}>{m.nome} — {m.categoria}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pcp-form-group">
                        <label>Observações Detalhadas</label>
                        <textarea
                            rows={4}
                            placeholder="Descreva a situação ou evidências da parada..."
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            className="pcp-textarea"
                        />
                    </div>
                </div>

                <footer className="pcp-modal-footer">
                    <button className="pcp-btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="pcp-btn-primary" onClick={handleConfirm}>
                        <Save size={18} /> Confirmar Registro
                    </button>
                </footer>
            </div>
        </div>
    );
};
