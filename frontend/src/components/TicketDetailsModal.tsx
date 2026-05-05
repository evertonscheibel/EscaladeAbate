import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, ticketService } from '../services/ticketService';
import { userService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    X,
    MessageSquare,
    Send,
    Calendar,
    User,
    Tag,
    Clock,
    FileText,
    CheckCircle,
    Play,
    AlertTriangle
} from 'lucide-react';
import { TicketTimeline } from './TicketTimeline';
import { AssignModal } from './AssignModal';
import './TicketDetailsModal.css';

interface TicketDetailsModalProps {
    ticket: Ticket;
    onClose: () => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket: initialTicket, onClose }) => {
    const { user } = useAuth();
    const [ticket, setTicket] = useState<Ticket>(initialTicket);
    const [activeTab, setActiveTab] = useState('info');
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const resp = await userService.getAll();
                let usersList: any[] = [];
                if (Array.isArray(resp.data)) {
                    usersList = resp.data;
                } else if (resp.data && Array.isArray(resp.data.data)) {
                    usersList = resp.data.data;
                }
                setAllUsers(usersList);
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
            }
        };
        if (user?.role === 'admin' || user?.role === 'tecnico') {
            loadUsers();
        }
    }, [user]);

    const refreshTicket = useCallback(async () => {
        try {
            const resp = await ticketService.getById(initialTicket._id);
            setTicket(resp.data);
        } catch (error) {
            console.error('Erro ao atualizar ticket:', error);
        }
    }, [initialTicket._id]);

    const handleWorkflowAction = async (action: string) => {
        if (!window.confirm(`Confirmar ação: ${action.toUpperCase()}?`)) return;

        try {
            switch (action) {
                case 'accept': await ticketService.accept(ticket._id); break;
                case 'start': await ticketService.start(ticket._id); break;
                case 'resolve':
                    const sol = prompt('Informe a solução:');
                    if (!sol) return;
                    await ticketService.resolve(ticket._id, sol);
                    break;
                case 'close': await ticketService.close(ticket._id); break;
                case 'reopen':
                    const reason = prompt('Motivo da reabertura:');
                    if (!reason) return;
                    await ticketService.reopen(ticket._id, reason);
                    break;
            }
            refreshTicket();
        } catch (error) {
            alert('Erro ao executar ação.');
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            await ticketService.addComment(ticket._id, newComment);
            setNewComment('');
            refreshTicket();
        } catch (error) {
            alert('Erro ao enviar comentário.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAgent = user?.role === 'admin' || user?.role === 'tecnico' || user?.role === 'agente';

    return (
        <div className="ticket-modal-overlay" onClick={onClose}>
            <div className="ticket-modal-card" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="ticket-header-info">
                        <div className="category-avatar">
                            <Tag size={28} />
                        </div>
                        <div>
                            <h2>{ticket.title}</h2>
                            <p>
                                <span className="protocol-text">#{ticket._id.slice(-6).toUpperCase()}</span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span className="text-sm text-gray-500">Aberto por <strong>{ticket.requester?.name || ticket.contactName}</strong></span>
                            </p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Fechar">
                        <X size={24} />
                    </button>
                </header>

                <div className="modal-top-bar">
                    <div className="top-bar-item">
                        <label>Status</label>
                        <div className={`status-pill status-${ticket.status}`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>

                    <div className="top-bar-item">
                        <label>Responsável</label>
                        {isAgent ? (
                            <select
                                value={Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0 ? (ticket.assignedTo[0] as any)._id : ''}
                                onChange={async (e) => {
                                    if (e.target.value) {
                                        await ticketService.assign(ticket._id, e.target.value, 'N1');
                                        refreshTicket();
                                    }
                                }}
                            >
                                <option value="">Não atribuído</option>
                                {allUsers.map(u => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="sidebar-value font-semibold">
                                {Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0
                                    ? (ticket.assignedTo[0] as any).name
                                    : 'Não atribuído'}
                            </div>
                        )}
                    </div>

                    <div className="top-bar-item">
                        <label>Prioridade</label>
                        <div className={`priority-chip priority-${ticket.priority}`}>
                            {ticket.priority.toUpperCase()}
                        </div>
                    </div>

                    <div className="top-bar-item" style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        {isAgent && (!ticket.assignedTo || ticket.assignedTo.length === 0) && (
                            <button className="btn-add-comment" onClick={() => handleWorkflowAction('accept')}>
                                <CheckCircle size={18} /> Aceitar
                            </button>
                        )}
                        {isAgent && (ticket.status === 'aberto') && ticket.assignedTo && ticket.assignedTo.length > 0 && (
                            <button className="btn-add-comment" style={{ background: '#3b82f6' }} onClick={() => handleWorkflowAction('start')}>
                                <Play size={18} /> Iniciar
                            </button>
                        )}
                        {isAgent && ticket.status === 'em_andamento' && (
                            <button className="btn-add-comment" style={{ background: '#10b981' }} onClick={() => handleWorkflowAction('resolve')}>
                                <CheckCircle size={18} /> Resolver
                            </button>
                        )}
                        {isAgent && (
                            <button className="btn-close" onClick={() => setShowAssignModal(true)} title="Alterar atribuição">
                                <User size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <nav className="modal-tabs">
                    <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
                        <FileText size={18} /> Informações
                    </button>
                    <button className={activeTab === 'comments' ? 'active' : ''} onClick={() => setActiveTab('comments')}>
                        <MessageSquare size={18} /> Comentários ({ticket.comments?.length || 0})
                    </button>
                    <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
                        <Clock size={18} /> Histórico
                    </button>
                </nav>

                <main className="modal-main-content">
                    {activeTab === 'info' && (
                        <div className="tab-pane-info">
                            <div className="info-section">
                                <h3><Tag size={20} className="text-indigo-500" /> Detalhes Gerais</h3>
                                <div className="info-grid">
                                    <div className="field-item">
                                        <span>Categoria</span>
                                        <p>{ticket.category}</p>
                                    </div>
                                    <div className="field-item">
                                        <span>Setor Requisitante</span>
                                        <p>{ticket.sector || 'TI'}</p>
                                    </div>
                                    <div className="field-item">
                                        <span>Data de Abertura</span>
                                        <p>{new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="field-item">
                                        <span>Nome do Contato</span>
                                        <p>{ticket.contactName || (ticket.requester?.name) || 'N/A'}</p>
                                    </div>
                                    <div className="field-item">
                                        <span>E-mail</span>
                                        <p>{ticket.contactEmail || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3><MessageSquare size={20} className="text-indigo-500" /> Descrição</h3>
                                <div className="description-card">
                                    <p>{ticket.description}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="interaction-layout">
                            <div className="comment-input-box">
                                <form onSubmit={handleAddComment}>
                                    <textarea
                                        placeholder="Adicionar um comentário ou atualização..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={3}
                                    />
                                    <button type="submit" className="btn-add-comment" disabled={isSubmitting || !newComment.trim()}>
                                        {isSubmitting ? 'Enviando...' : <><Send size={18} /> Comentar</>}
                                    </button>
                                </form>
                            </div>

                            <div className="comments-list">
                                {ticket.comments && ticket.comments.length > 0 ? (
                                    ticket.comments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((c: any, i: number) => (
                                        <div key={i} className="mb-6 last:mb-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                    {(c.author || c.user?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-sm text-gray-700">{c.author || c.user?.name}</span>
                                                <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 text-sm border border-gray-100">
                                                {c.content || c.comment}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-400 italic">
                                        Nenhum comentário registrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="history-tab">
                            <div className="info-section">
                                <h3><Clock size={20} className="text-indigo-500" /> Histórico de Alterações</h3>
                                <div className="mt-4">
                                    <TicketTimeline ticketId={ticket._id} />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="modal-footer">
                    <button className="btn-close-modal" onClick={onClose}>Fechar</button>
                </footer>
            </div>

            {showAssignModal && (
                <AssignModal
                    ticketId={ticket._id}
                    currentAssigneeId={Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0
                        ? (ticket.assignedTo[0] as any)._id
                        : undefined}
                    onClose={() => setShowAssignModal(false)}
                    onAssign={async (userId, level) => {
                        try {
                            await ticketService.assign(ticket._id, userId, level);
                            setShowAssignModal(false);
                            refreshTicket();
                        } catch (error) {
                            alert('Erro ao atribuir ticket');
                        }
                    }}
                />
            )}
        </div>
    );
};
