import React, { useState, useEffect, useCallback } from 'react';
import {
    jobPositionService,
    JobPosition
} from '../services';
import {
    X,
    Briefcase,
    Building2,
    Users,
    DollarSign,
    Calendar,
    MapPin,
    User,
    Save,
    Trash2
} from 'lucide-react';
import './JobPositionModal.css';

interface JobPositionModalProps {
    positionId?: string;
    onClose: () => void;
    onSave?: () => void;
}

const JobPositionModal: React.FC<JobPositionModalProps> = ({ positionId, onClose, onSave }) => {
    const isEditing = !!positionId;
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState<Partial<JobPosition>>({
        titulo_vaga: '',
        id_externo: '',
        setor: '',
        gestor: '',
        qtd_vagas: 1,
        status: 'EM_ABERTO',
        regiao: '',
        salario: {
            salario_base: 0,
            faixa_min: 0,
            faixa_max: 0,
            moeda: 'BRL'
        },
        observacao: ''
    });

    const loadData = useCallback(async () => {
        if (!positionId) return;
        setLoading(true);
        try {
            const response = await jobPositionService.getById(positionId);
            setFormData(response.data);
        } catch (error) {
            console.error('Erro ao carregar dados da vaga:', error);
            onClose();
        } finally {
            setLoading(false);
        }
    }, [positionId, onClose]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('salario.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                salario: {
                    ...prev.salario!,
                    [field]: field === 'moeda' ? value : Number(value)
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'qtd_vagas' ? Number(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing && positionId) {
                await jobPositionService.update(positionId, formData);
            } else {
                await jobPositionService.create(formData);
            }
            if (onSave) onSave();
        } catch (error) {
            console.error('Erro ao salvar vaga:', error);
            alert('Erro ao salvar vaga. Verifique os dados (ID Externo deve ser único).');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="job-position-modal-overlay">
                <div className="job-position-modal-card loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="job-position-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="job-position-modal-card">
                <header className="modal-header">
                    <div className="title-section">
                        <h2>{isEditing ? 'Editar Vaga' : 'Nova Vaga'}</h2>
                        <p>{isEditing ? `Editando ${formData.titulo_vaga}` : 'Preencha os dados da nova oportunidade'}</p>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Fechar">
                        <X size={24} />
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <main className="modal-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Título da Vaga *</label>
                                <input
                                    type="text"
                                    name="titulo_vaga"
                                    value={formData.titulo_vaga}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Desenvolvedor Full Stack"
                                />
                            </div>
                            <div className="form-group">
                                <label>ID Externo (Código) *</label>
                                <input
                                    type="text"
                                    name="id_externo"
                                    value={formData.id_externo}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: TI-001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Setor *</label>
                                <input
                                    type="text"
                                    name="setor"
                                    value={formData.setor}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Tecnologia"
                                />
                            </div>
                            <div className="form-group">
                                <label>Gestor Responsável</label>
                                <input
                                    type="text"
                                    name="gestor"
                                    value={formData.gestor}
                                    onChange={handleChange}
                                    placeholder="Nome do gestor"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="EM_ABERTO">Em Aberto</option>
                                    <option value="FECHADA">Fechada</option>
                                    <option value="CANCELADA">Cancelada</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantidade de Vagas</label>
                                <input
                                    type="number"
                                    name="qtd_vagas"
                                    value={formData.qtd_vagas}
                                    onChange={handleChange}
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>Região</label>
                                <input
                                    type="text"
                                    name="regiao"
                                    value={formData.regiao}
                                    onChange={handleChange}
                                    placeholder="Ex: Matriz / Remoto"
                                />
                            </div>
                        </div>

                        <h3 className="section-title"><DollarSign size={18} /> Remuneração (BRL)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Salário Base</label>
                                <input
                                    type="number"
                                    name="salario.salario_base"
                                    value={formData.salario?.salario_base}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label>Faixa Mínima</label>
                                <input
                                    type="number"
                                    name="salario.faixa_min"
                                    value={formData.salario?.faixa_min}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label>Faixa Máxima</label>
                                <input
                                    type="number"
                                    name="salario.faixa_max"
                                    value={formData.salario?.faixa_max}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Observações / Descrição</label>
                            <textarea
                                name="observacao"
                                value={formData.observacao}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Detalhes adicionais sobre a vaga..."
                            ></textarea>
                        </div>
                    </main>

                    <footer className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <div className="spinner-small"></div> : <Save size={18} />}
                            {isEditing ? 'Salvar Alterações' : 'Criar Vaga'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default JobPositionModal;
