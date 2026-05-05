import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SlaughterClosureLine } from '../types/slaughterClosure';
import './Modal.css'; // Assuming existence of a common modal CSS or I'll add inline

interface ClosureLotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedLine: SlaughterClosureLine) => void;
    line: SlaughterClosureLine;
}

const ClosureLotModal: React.FC<ClosureLotModalProps> = ({ isOpen, onClose, onSave, line }) => {
    const [formData, setFormData] = useState<SlaughterClosureLine>({ ...line });

    useEffect(() => {
        setFormData({ ...line });
    }, [line]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['boi', 'vaca', 'novilha', 'bubalino', 'touro'].includes(name);

        const newValue = isNumeric ? parseInt(value) || 0 : value;

        const updatedData = { ...formData, [name]: newValue };

        if (isNumeric) {
            updatedData.total = (updatedData.boi || 0) +
                (updatedData.vaca || 0) +
                (updatedData.novilha || 0) +
                (updatedData.bubalino || 0) +
                (updatedData.touro || 0);
        }

        setFormData(updatedData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Editar Lote - Seq {formData.sequence}</h2>
                    <button onClick={onClose} className="close-btn"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-section">
                        <h3>Informações Básicas</h3>
                        <div className="form-group full">
                            <label>Pecuarista</label>
                            <input type="text" name="producerName" value={formData.producerName} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Município</label>
                                <input type="text" name="municipio" value={formData.municipio} onChange={handleChange} />
                            </div>
                            <div className="form-group small">
                                <label>UF</label>
                                <input type="text" name="uf" value={formData.uf} onChange={handleChange} maxLength={2} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Quantidades</h3>
                        <div className="form-grid-5">
                            <div className="form-group">
                                <label>Boi</label>
                                <input type="number" name="boi" value={formData.boi} onChange={handleChange} min="0" />
                            </div>
                            <div className="form-group">
                                <label>Vaca</label>
                                <input type="number" name="vaca" value={formData.vaca} onChange={handleChange} min="0" />
                            </div>
                            <div className="form-group">
                                <label>Novilha</label>
                                <input type="number" name="novilha" value={formData.novilha} onChange={handleChange} min="0" />
                            </div>
                            <div className="form-group">
                                <label>Bubalino</label>
                                <input type="number" name="bubalino" value={formData.bubalino} onChange={handleChange} min="0" />
                            </div>
                            <div className="form-group">
                                <label>Touro</label>
                                <input type="number" name="touro" value={formData.touro} onChange={handleChange} min="0" />
                            </div>
                        </div>
                        <div style={{ marginTop: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                            Total: {formData.total}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Informações SIF</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Curral</label>
                                <input type="text" name="curral" value={formData.curral || ''} onChange={handleChange} placeholder="ex: 26" />
                            </div>
                            <div className="form-group">
                                <label>Cor/Capa</label>
                                <input type="text" name="cor" value={formData.cor || ''} onChange={handleChange} placeholder="ex: 11" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>NF</label>
                                <input type="text" name="nf" value={formData.nf || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>GTA</label>
                                <input type="text" name="gta" value={formData.gta || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group full">
                            <label>Observações</label>
                            <textarea name="observations" value={formData.observations || ''} onChange={handleChange} rows={2} />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-save"><Save size={18} /> Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClosureLotModal;
