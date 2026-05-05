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
    User
} from 'lucide-react';
import './JobPositionModal.css';

interface JobPositionModalProps {
    positionId: string;
    onClose: () => void;
}

const JobPositionModal: React.FC<JobPositionModalProps> = ({ positionId, onClose }) => {
    const [position, setPosition] = useState<JobPosition | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await jobPositionService.getById(positionId);
            setPosition(response.data);
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

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading || !position) {
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
                        <h2>{position.titulo_vaga}</h2>
                        <p>ID Externo: <code className="protocol-text">{position.id_externo}</code></p>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Fechar">
                        <X size={24} />
                    </button>
                </header>

                <main className="modal-content">
                    <section className="details-grid">
                        <div className="detail-item">
                            <label>Status</label>
                            <div>
                                <span className={`status-indicator status-${position.status}`}>
                                    {position.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div className="detail-item">
                            <label><Building2 size={14} /> Setor</label>
                            <span>{position.setor}</span>
                        </div>
                        <div className="detail-item">
                            <label><User size={14} /> Gestor Responsável</label>
                            <span>{position.gestor || 'Não informado'}</span>
                        </div>
                        <div className="detail-item">
                            <label><Users size={14} /> Quantidade de Vagas</label>
                            <span>{position.qtd_vagas}</span>
                        </div>
                        <div className="detail-item">
                            <label><MapPin size={14} /> Região</label>
                            <span>{position.regiao || 'Geral'}</span>
                        </div>
                        <div className="detail-item">
                            <label><Calendar size={14} /> Data de Criação</label>
                            <span>{new Date(position.createdAt).toLocaleDateString()}</span>
                        </div>
                    </section>

                    <section className="salary-section">
                        <h3><DollarSign size={18} /> Remuneração e Faixas</h3>
                        <div className="salary-grid">
                            <div className="detail-item">
                                <label>Salário Base</label>
                                <span>{formatCurrency(position.salario?.salario_base)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Faixa Mínima</label>
                                <span>{formatCurrency(position.salario?.faixa_min)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Faixa Máxima</label>
                                <span>{formatCurrency(position.salario?.faixa_max)}</span>
                            </div>
                        </div>
                        {position.salario?.referencia_cargo && (
                            <div style={{ marginTop: '16px' }} className="detail-item">
                                <label>Referência de Mercado</label>
                                <span style={{ fontSize: '0.875rem' }}>{position.salario.referencia_cargo}</span>
                            </div>
                        )}
                    </section>

                    {position.observacao && (
                        <section className="observations-section">
                            <h3>Observações</h3>
                            <div className="observations-text">
                                {position.observacao}
                            </div>
                        </section>
                    )}
                </main>

                <footer className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Fechar</button>
                </footer>
            </div>
        </div>
    );
};

export default JobPositionModal;
