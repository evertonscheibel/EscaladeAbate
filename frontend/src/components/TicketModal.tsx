import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ticketService, Ticket } from '../services/ticketService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Upload, File, Trash2, Send, Plus, Ticket as TicketIcon } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';
import './TicketModal.css';

// Categorias padrão do sistema
const DEFAULT_CATEGORIES = [
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'rede', label: 'Rede' },
    { value: 'acesso', label: 'Acesso' },
    { value: 'sistec', label: 'SISTEC' },
    { value: 'email', label: 'E-mail' },
    { value: 'impressora', label: 'Impressora' },
    { value: 'telefonia', label: 'Telefonia' },
    { value: 'outros', label: 'Outros' }
];

interface TicketModalProps {
    ticket: Ticket | null;
    onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ ticket, onClose }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: ticket?.title || '',
        description: ticket?.description || '',
        category: ticket?.category || 'outros',
        priority: ticket?.priority || 'media',
        status: ticket?.status || 'aberto',
        assignedTo: ticket?.assignedTo ? (Array.isArray(ticket.assignedTo) ? ticket.assignedTo.map((u: any) => typeof u === 'object' ? u._id : u) : [typeof ticket.assignedTo === 'object' ? (ticket.assignedTo as any)._id : ticket.assignedTo]) : [],
        sector: ticket?.sector || ''
    });
    const [files, setFiles] = useState<File[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryValue, setNewCategoryValue] = useState('');
    const [customCategories, setCustomCategories] = useState<{ value: string, label: string }[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'tecnico') {
            loadTechnicians();
        }
    }, [user]);

    const loadTechnicians = async () => {
        try {
            const response = await api.get('/users?limit=100&active=true');
            let usersList = [];
            if (Array.isArray(response.data)) {
                usersList = response.data;
            } else if (response.data?.data) {
                usersList = response.data.data;
            }
            const techs = usersList.filter((u: any) => (u.role === 'tecnico' || u.role === 'admin') && u.active !== false);
            setTechnicians(techs);
        } catch (error) {
            console.error('Erro ao carregar técnicos:', error);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 5242880, // 5MB
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc', '.docx'],
            'text/*': ['.txt']
        }
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend: any = { ...formData };

            if (!dataToSend.assignedTo) {
                delete dataToSend.assignedTo;
            }

            if (ticket) {
                await ticketService.update(ticket._id, dataToSend);
            } else {
                await ticketService.create(dataToSend);
            }

            onClose();
            window.location.reload();
        } catch (error: any) {
            console.error('Erro ao salvar ticket:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido ao salvar ticket';
            alert(`Erro ao salvar ticket: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !ticket) return;

        try {
            await ticketService.addComment(ticket._id, newComment);
            setNewComment('');
            window.location.reload();
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
        }
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button
                type="submit"
                form="ticket-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                {loading ? 'Salvando...' : ticket ? 'Atualizar' : 'Criar Ticket'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={ticket ? 'Detalhes do Ticket' : 'Novo Ticket'}
            icon={<TicketIcon size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="ticket-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Título *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Digite o título do ticket"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Descrição *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={4}
                            placeholder="Descreva o problema em detalhes"
                        />
                    </div>

                    <div className="form-group">
                        <label>Setor</label>
                        <input
                            type="text"
                            value={formData.sector}
                            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                            placeholder="Ex: Financeiro, RH..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Categoria</label>
                        <div className="category-field-wrapper">
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="category-select"
                            >
                                {[...DEFAULT_CATEGORIES, ...customCategories].map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="btn-add-category"
                                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                                title="Adicionar nova categoria"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        {showNewCategoryInput && (
                            <div className="new-category-input-wrapper">
                                <input
                                    type="text"
                                    value={newCategoryValue}
                                    onChange={(e) => setNewCategoryValue(e.target.value)}
                                    placeholder="Nome da nova categoria"
                                    className="new-category-input"
                                />
                                <button
                                    type="button"
                                    className="btn-confirm-category"
                                    onClick={() => {
                                        if (newCategoryValue.trim()) {
                                            const newCat = {
                                                value: newCategoryValue.toLowerCase().replace(/\s+/g, '_'),
                                                label: newCategoryValue.trim()
                                            };
                                            setCustomCategories(prev => [...prev, newCat]);
                                            setFormData({ ...formData, category: newCat.value });
                                            setNewCategoryValue('');
                                            setShowNewCategoryInput(false);
                                        }
                                    }}
                                >
                                    Adicionar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Prioridade</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as "baixa" | "media" | "alta" | "critica" })}
                        >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                            <option value="critica">Crítica</option>
                        </select>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'tecnico') && (
                        <>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "aberto" | "em_andamento" | "resolvido" | "fechado" })}
                                >
                                    <option value="aberto">Aberto</option>
                                    <option value="em_andamento">Em Andamento</option>
                                    <option value="resolvido">Resolvido</option>
                                    <option value="fechado">Fechado</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Responsáveis</label>
                                <p className="field-hint">Clique para selecionar ou remover atendentes</p>
                                <div className="attendant-cards-container">
                                    {technicians.map(tech => {
                                        const isSelected = formData.assignedTo.includes(tech._id);
                                        const initials = tech.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                                        return (
                                            <div
                                                key={tech._id}
                                                className={`attendant-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFormData(prev => {
                                                        const current = [...prev.assignedTo];
                                                        if (isSelected) {
                                                            return { ...prev, assignedTo: current.filter(id => id !== tech._id) };
                                                        } else {
                                                            return { ...prev, assignedTo: [...current, tech._id] };
                                                        }
                                                    });
                                                }}
                                            >
                                                <div className="attendant-avatar">{initials}</div>
                                                <span className="attendant-name">{tech.name}</span>
                                                {isSelected && <div className="selected-indicator">✓</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Upload de Arquivos */}
                    <div className="form-group full-width">
                        <label>Anexos</label>
                        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                            <input {...getInputProps()} />
                            <Upload size={32} />
                            <p>
                                {isDragActive
                                    ? 'Solte os arquivos aqui...'
                                    : 'Arraste arquivos ou clique para selecionar'}
                            </p>
                            <span className="dropzone-hint">
                                Máximo 5MB por arquivo (PDF, DOC, imagens)
                            </span>
                        </div>

                        {files.length > 0 && (
                            <div className="files-list">
                                {files.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <File size={20} />
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
                                        <button
                                            type="button"
                                            className="remove-file-btn"
                                            onClick={() => removeFile(index)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Comentários (apenas se for ticket existente) */}
                {ticket && (
                    <div className="comments-section">
                        <h3>Comentários ({ticket.comments.length})</h3>

                        <div className="comments-list">
                            {ticket.comments.map((comment: any, index: number) => (
                                <div key={index} className="comment-item">
                                    <div className="comment-header">
                                        <strong>{comment.user?.name || 'Usuário'}</strong>
                                        <span>{new Date(comment.createdAt).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <p>{comment.comment}</p>
                                </div>
                            ))}
                        </div>

                        <div className="add-comment">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Adicionar comentário..."
                                rows={3}
                            />
                            <button
                                type="button"
                                className="btn-send-comment"
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                            >
                                <Send size={18} />
                                Enviar
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </StandardFormModal>
    );
};
