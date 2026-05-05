import React, { useState } from 'react';
import { Ticket, ticketService } from '../services/ticketService';
import { useAuth } from '../context/AuthContext';
import { X, MessageSquare, Paperclip, Send, Calendar, User, Tag, AlertTriangle, Play, Pause, CheckCircle, ArrowRight, UserPlus, XCircle, Clock } from 'lucide-react';
import { TicketTimeline } from './TicketTimeline';
import { AssignModal } from './AssignModal';
import './TicketDetailsModal.css';

interface TicketDetailsModalProps {
    ticket: Ticket;
    onClose: () => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose }) => {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

    const isAgent = user?.role === 'admin' || user?.role === 'tecnico';
    const isAssignee = ticket.assignedTo?._id === user?._id;

    // Timer Logic
    React.useEffect(() => {
        const calculateTime = () => {
            if (!ticket.acceptedAt) return '00:00:00';

            const start = new Date(ticket.acceptedAt).getTime();
            const end = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : new Date().getTime();
            const diff = Math.max(0, end - start);

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setElapsedTime(calculateTime());

        let interval: any;
        if (ticket.status === 'em_andamento' || (ticket.status === 'aberto' && ticket.acceptedAt)) {
            interval = setInterval(() => {
                setElapsedTime(calculateTime());
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [ticket]);

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            baixa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            media: 'bg-amber-100 text-amber-800 border-amber-200',
            alta: 'bg-orange-100 text-orange-800 border-orange-200',
            critica: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[priority] || 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            aberto: 'bg-blue-100 text-blue-800 border-blue-200',
            em_andamento: 'bg-purple-100 text-purple-800 border-purple-200',
            resolvido: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            fechado: 'bg-slate-100 text-slate-800 border-slate-200'
        };
        return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            await ticketService.addComment(ticket._id, newComment);
            setNewComment('');
            // Recarregar a página para atualizar os comentários (idealmente seria via callback, mas manteremos simples por enquanto)
            window.location.reload();
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            alert('Erro ao enviar comentário.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssign = async (userId: string, level: string) => {
        try {
            await ticketService.assign(ticket._id, userId, level);
            setShowAssignModal(false);
            onClose(); // Fechar para atualizar lista (ou pode recarregar)
            window.location.reload();
        } catch (error) {
            console.error('Erro ao atribuir:', error);
            alert('Erro ao atribuir ticket');
        }
    };

    const handleWorkflowAction = async (action: string, data?: any) => {
        if (!window.confirm(`Tem certeza que deseja executar: ${action}?`)) return;

        try {
            switch (action) {
                case 'accept':
                    await ticketService.accept(ticket._id);
                    break;
                case 'start':
                    await ticketService.start(ticket._id);
                    break;
                case 'resolve':
                    const resolutionObj = prompt('Informe a solução:');
                    if (!resolutionObj) return;
                    await ticketService.resolve(ticket._id, resolutionObj);
                    break;
                case 'close':
                    await ticketService.close(ticket._id);
                    break;
                case 'reopen':
                    const reason = prompt('Motivo da reabertura:');
                    if (!reason) return;
                    await ticketService.reopen(ticket._id, reason);
                    break;
            }
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(`Erro na ação ${action}:`, error);
            alert(`Erro ao executar ação: ${action}`);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <h2>#{ticket._id.slice(-6)} - {ticket.title}</h2>
                        <span className={`status-badge-lg ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                        {ticket.acceptedAt && (
                            <div
                                className="timer-badge"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#1e293b',
                                    color: '#4ade80',
                                    padding: '4px 12px',
                                    borderRadius: '999px',
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                    fontSize: '1rem',
                                    marginLeft: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                title="Tempo de Atuação"
                            >
                                <Clock size={16} />
                                {elapsedTime}
                            </div>
                        )}
                    </div>

                    <div className="header-actions" style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                        {/* Botões de Ação do Workflow */}
                        {isAgent && ticket.status !== 'fechado' && (
                            <button className="btn-primary btn-sm" onClick={() => setShowAssignModal(true)}>
                                <UserPlus size={16} /> Atribuir
                            </button>
                        )}

                        {isAgent && ticket.status === 'aberto' && !ticket.assignedTo && (
                            <button className="btn-primary btn-sm" onClick={() => handleWorkflowAction('accept')}>
                                <CheckCircle size={16} /> Aceitar
                            </button>
                        )}

                        {isAgent && (ticket.status === 'aberto' || ticket.status === 'em_andamento') && isAssignee && (
                            <button className="btn-warning btn-sm" onClick={() => handleWorkflowAction('start')}>
                                <Play size={16} /> Iniciar
                            </button>
                        )}

                        {isAgent && ticket.status === 'em_andamento' && isAssignee && (
                            <button className="btn-success btn-sm" onClick={() => handleWorkflowAction('resolve')}>
                                <CheckCircle size={16} /> Resolver
                            </button>
                        )}

                        {isAgent && ticket.status === 'resolvido' && (
                            <button className="btn-secondary btn-sm" onClick={() => handleWorkflowAction('close')}>
                                <XCircle size={16} /> Fechar
                            </button>
                        )}

                        {ticket.status === 'fechado' && (
                            <button className="btn-danger btn-sm" onClick={() => handleWorkflowAction('reopen')}>
                                <AlertTriangle size={16} /> Reabrir
                            </button>
                        )}
                    </div>

                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body details-body">
                    <div className="details-grid">
                        <div className="details-main">
                            <div className="info-section">
                                <h3>Descrição</h3>
                                <p className="description-text">
                                    {ticket.description}
                                </p>
                            </div>

                            <div className="info-section">
                                <h3>Anexos ({ticket.attachments.length})</h3>
                                {ticket.attachments.length > 0 ? (
                                    <div className="attachments-list">
                                        {ticket.attachments.map((file: any, index: number) => (
                                            <div key={index} className="attachment-item">
                                                <Paperclip size={16} />
                                                <span>{file.fileName || `Arquivo ${index + 1}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">Nenhum anexo.</p>
                                )}
                            </div>

                            <div className="comments-section">
                                <h3>Comentários</h3>
                                <div className="comments-timeline">
                                    {ticket.comments.length > 0 ? (
                                        ticket.comments.map((comment: any, index: number) => (
                                            <div key={index} className="comment-bubble">
                                                <div className="comment-meta">
                                                    <strong>{comment.user?.name || 'Usuário'}</strong>
                                                    <span>{new Date(comment.createdAt).toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="comment-content">
                                                    {comment.comment}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-data">Nenhum comentário ainda.</p>
                                    )}
                                </div>

                                <div className="add-comment-box">
                                    <textarea
                                        placeholder="Escreva um comentário..."
                                        rows={3}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    ></textarea>
                                    <button
                                        className="btn-primary btn-sm"
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isSubmitting}
                                    >
                                        <Send size={16} /> Enviar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="details-sidebar">
                            <div className="sidebar-group">
                                <label><Tag size={16} /> Categoria</label>
                                <span className="sidebar-value">{ticket.category}</span>
                            </div>

                            <div className="sidebar-group">
                                <label><AlertTriangle size={16} /> Prioridade</label>
                                <span className={`priority-tag ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority.toUpperCase()}
                                </span>
                            </div>

                            <div className="sidebar-group">
                                <label><User size={16} /> Solicitante</label>
                                <span className="sidebar-value">{ticket.requester?.name || ticket.contactName || 'N/A'}</span>
                                {ticket.contactEmail && <span className="text-xs text-gray-500">{ticket.contactEmail}</span>}
                            </div>

                            <div className="sidebar-group">
                                <label><User size={16} /> Responsável</label>
                                <span className="sidebar-value">{ticket.assignedTo?.name || 'Não atribuído'}</span>
                                {isAgent && !ticket.assignedTo && (
                                    <button
                                        className="text-blue-500 text-sm hover:underline mt-1 block"
                                        onClick={() => setShowAssignModal(true)}
                                    >
                                        Atribuir agora
                                    </button>
                                )}
                            </div>

                            <div className="sidebar-group">
                                <label><Calendar size={16} /> Criado em</label>
                                <span className="sidebar-value">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
                            </div>

                            <div className="sidebar-group">
                                <label><Clock size={16} /> Histórico</label>
                                <TicketTimeline ticketId={ticket._id} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showAssignModal && (
                <AssignModal
                    ticketId={ticket._id}
                    onClose={() => setShowAssignModal(false)}
                    onAssign={handleAssign}
                    currentAssigneeId={ticket.assignedTo?._id}
                />
            )}
        </div>
    );
};
