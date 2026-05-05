import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import './PublicTicketForm.css';

export const PublicTicketForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        title: '',
        description: '',
        category: 'suporte'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/tickets/public', formData);
            setSuccess(true);
            setTicketNumber(response.data.data.ticketNumber);
            setFormData({
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                title: '',
                description: '',
                category: 'suporte'
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao enviar chamado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="public-ticket-container">
                <div className="public-ticket-card success-card">
                    <div className="success-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h1>Chamado Registrado com Sucesso!</h1>
                    <p className="success-message">
                        Seu chamado foi registrado e nossa equipe entrará em contato em breve.
                    </p>
                    {ticketNumber && (
                        <div className="ticket-number-box">
                            <span className="label">Número do Chamado:</span>
                            <span className="number">#{ticketNumber}</span>
                        </div>
                    )}
                    <p className="contact-info">
                        Enviamos uma confirmação para <strong>{formData.contactEmail}</strong>
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setSuccess(false);
                            setTicketNumber('');
                        }}
                    >
                        Abrir Novo Chamado
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="public-ticket-container">
            <div className="public-ticket-card">
                <div className="card-header">
                    <h1>Abrir Chamado de Suporte</h1>
                    <p>Preencha o formulário abaixo e nossa equipe entrará em contato</p>
                </div>

                <form onSubmit={handleSubmit} className="ticket-form">
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contactName">Nome Completo *</label>
                            <input
                                type="text"
                                id="contactName"
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                required
                                placeholder="Digite seu nome"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contactEmail">Email *</label>
                            <input
                                type="email"
                                id="contactEmail"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                required
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contactPhone">Telefone</label>
                            <input
                                type="tel"
                                id="contactPhone"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="category">Categoria *</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="suporte">Suporte Técnico</option>
                                <option value="hardware">Hardware</option>
                                <option value="software">Software</option>
                                <option value="rede">Rede</option>
                                <option value="acesso">Acesso</option>
                                <option value="sistec">SISTEC</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="title">Assunto *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Descreva brevemente o problema"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Descrição do Problema *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={6}
                            placeholder="Descreva o problema em detalhes..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner-small"></div>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Enviar Chamado
                            </>
                        )}
                    </button>

                    <p className="form-footer">
                        * Campos obrigatórios
                    </p>
                </form>
            </div>
        </div>
    );
};
