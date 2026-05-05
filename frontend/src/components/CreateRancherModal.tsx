import React, { useState } from 'react';
import { X } from 'lucide-react';
import { rancherService } from '../services';
import { Rancher } from '../types/slaughter';
import './CreateRancherModal.css';

interface CreateRancherModalProps {
    initialName: string;
    onClose: () => void;
    onCreated: (rancher: Rancher) => void;
}

export const CreateRancherModal: React.FC<CreateRancherModalProps> = ({
    initialName,
    onClose,
    onCreated
}) => {
    const [formData, setFormData] = useState({
        name: initialName,
        cpfCnpj: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const rancher = await rancherService.create(formData);
            onCreated(rancher);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao criar pecuarista');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container rancher-modal">
                <div className="modal-header">
                    <h2>Cadastrar Novo Pecuarista</h2>
                    <button onClick={onClose} className="close-button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label>Nome *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>CPF/CNPJ</label>
                            <input
                                type="text"
                                value={formData.cpfCnpj}
                                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Telefone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>E-mail</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
