import React, { useEffect, useState } from 'react';
import { ticketService, Ticket } from '../services/ticketService';
import { AssignModal } from '../components/AssignModal';
import { User } from 'lucide-react';
import './ManagerQueue.css';

import { useAuth } from '../context/AuthContext';

export const ManagerQueue: React.FC = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'unassigned'>('all');

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        // ... (código existente) ...
        setLoading(true);
        try {
            const result = await ticketService.getAll();
            const sorted = result.data.sort((a: Ticket, b: Ticket) => {
                if (!a.assignedTo && b.assignedTo) return -1;
                if (a.assignedTo && !b.assignedTo) return 1;
                return 0;
            });
            setTickets(sorted);
        } catch (error) {
            console.error('Erro ao carregar fila:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (userId: string, level: string) => {
        // ... (código existente) ...
        if (!assignTicketId) return;
        try {
            await ticketService.assign(assignTicketId, userId, level);
            setAssignTicketId(null);
            loadQueue();
        } catch (error) {
            alert('Erro ao atribuir ticket');
        }
    };

    const filteredTickets = tickets.filter(t => {
        const isAssignedToMe = Array.isArray(t.assignedTo) && t.assignedTo.some(u => (typeof u === 'object' ? u._id : u) === user?.id);
        if (filterMode === 'mine') return isAssignedToMe;
        if (filterMode === 'unassigned') return !t.assignedTo || (Array.isArray(t.assignedTo) && t.assignedTo.length === 0);
        return true;
    });

    return (
        <div className="manager-queue">
            <div className="hq-header">
                <h1>Fila de Gestão e Atribuição</h1>
                <div className="filter-buttons">
                    <button
                        className={`btn-filter ${filterMode === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterMode('all')}
                    >
                        Todos
                    </button>
                    <button
                        className={`btn-filter ${filterMode === 'mine' ? 'active' : ''}`}
                        onClick={() => setFilterMode('mine')}
                    >
                        Meus Tickets
                    </button>
                    <button
                        className={`btn-filter ${filterMode === 'unassigned' ? 'active' : ''}`}
                        onClick={() => setFilterMode('unassigned')}
                    >
                        Não Atribuídos
                    </button>
                </div>
            </div>

            <div className="queue-table-container">
                <table className="queue-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Assunto</th>
                            <th>Status</th>
                            <th>Prioridade</th>
                            <th>Responsável Atual</th>
                            <th>Métricas (Tempo Aberto)</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map(ticket => (
                            <tr key={ticket._id} className={!ticket.assignedTo ? 'unassigned-row' : ''}>
                                <td>#{ticket._id.slice(-6)}</td>
                                <td>{ticket.title}</td>
                                <td><span className={`status-badge ${ticket.status}`}>{ticket.status}</span></td>
                                <td>{ticket.priority}</td>
                                <td>
                                    {Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0 ? (
                                        <div className="assignee-cell">
                                            <div className="avatar-circle small">
                                                {(ticket.assignedTo[0] as any).name?.charAt(0) || 'U'}
                                            </div>
                                            <span>{(ticket.assignedTo[0] as any).name}</span>
                                            {ticket.assignedTo.length > 1 && <span className="text-xs text-gray-400 ml-1">+{ticket.assignedTo.length - 1}</span>}
                                        </div>
                                    ) : (
                                        <span className="text-muted">-- Não atribuído --</span>
                                    )}
                                </td>
                                <td>
                                    {ticket.acceptedAt ? (
                                        <span title="Tempo de Atuação" style={{ color: '#10b981', fontWeight: 500 }}>
                                            ⏱️ {Math.floor((new Date().getTime() - new Date(ticket.acceptedAt).getTime()) / (1000 * 3600))}h {Math.floor(((new Date().getTime() - new Date(ticket.acceptedAt).getTime()) % (3600000)) / 60000)}m
                                        </span>
                                    ) : (
                                        <span title="Tempo Aberto">
                                            ⌛ {Math.floor((new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 3600))}h
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="btn-assign"
                                        onClick={() => setAssignTicketId(ticket._id)}
                                    >
                                        <User size={16} /> {ticket.assignedTo ? 'Reatribuir' : 'Atribuir'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {assignTicketId && (
                <AssignModal
                    ticketId={assignTicketId}
                    onClose={() => setAssignTicketId(null)}
                    onAssign={handleAssign}
                />
            )}
        </div>
    );
};
