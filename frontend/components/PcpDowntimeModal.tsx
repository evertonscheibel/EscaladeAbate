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
                        <AlertTriangle color="#f59e0b" size={24} />
                        <h2>Registrar Parada de OP</h2>
                    </div>
                    <button className="pcp-modal-close" onClick={onClose}><X /></button>
                </header>

                <div className="pcp-modal-body">
                    <p className="pcp-modal-hint">Selecione o motivo da interrupção da produção para esta Ordem de Produção.</p>

                    <div className="pcp-form-group">
                        <label>Motivo da Parada</label>
                        <select
                            value={selectedMotivo}
                            onChange={(e) => setSelectedMotivo(e.target.value)}
                            className="pcp-select"
                        >
                            <option value="">-- Selecione o Motivo --</option>
                            {motivos.map(m => (
                                <option key={m._id} value={m._id}>{m.nome} ({m.categoria})</option>
                            ))}
                        </select>
                    </div>

                    <div className="pcp-form-group">
                        <label>Observações / Evidências</label>
                        <textarea
                            rows={3}
                            placeholder="Descreva brevemente a ocorrência..."
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            className="pcp-textarea"
                        />
                    </div>
                </div>

                <footer className="pcp-modal-footer">
                    <button className="pcp-btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="pcp-btn-primary" onClick={handleConfirm}>
                        <Save size={18} /> Confirmar Pausa
                    </button>
                </footer>
            </div>
        </div>
    );
};
