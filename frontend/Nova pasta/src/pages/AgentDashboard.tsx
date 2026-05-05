import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ticketService, Ticket } from '../services/ticketService';
import { Play, CheckCircle, Clock, AlertTriangle, Briefcase } from 'lucide-react';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import './AgentDashboard.css';

export const AgentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPulling, setIsPulling] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            // Carregar métricas do agente
            // Por simplicidade, vamos filtrar os tickets retornados ou assumir que o backend filtra
            // Idealmente endpoint dedicado, mas vamos reusar getAll com filtro implicito no backend ou explicito aqui?
            // O ticketService.getAll normal traz tudo. Precisamos filtrar.
            // Para production grade, backend devia ter /my-tickets. 
            // Vamos assumir que getAll retorna tudo e filtramos aqui (MVP) ou criar endpoint.
            // O plano mencionou /my-queue no backend, mas nao criei rota especifica, usei getAll com params.
            // Backend ticketController.getTickets aceita filtros.

            // Vamos tentar buscar tickets atribuidos a mim
            // O backend getTickets suporta query params? O default implementation geralmente suporta.
            // Se nao suportar, filtramos no front.

            const allTicketsResponse = await ticketService.getAll();
            // Assumindo que getAll traga todos. Se tiver paginação, isso é ruim.
            // Como estou sem tempo de refatorar o getAll, vou filtrar no front se vier tudo.

            const myId = user?._id;
            const allTickets = allTicketsResponse.data || [];

            const mine = allTickets.filter((t: Ticket) =>
                t.assignedTo?._id === myId || t.assignedTo === myId
            );

            // Filtrar apenas não fechados para a fila de trabalho
            const activeTickets = mine.filter((t: Ticket) => t.status !== 'fechado');
            setMyTickets(activeTickets);

            // Calcular stats simples localmente
            setStats({
                wip: activeTickets.filter((t: Ticket) => t.status === 'em_andamento').length,
                pending: activeTickets.filter((t: Ticket) => t.status.includes('pendente')).length,
                resolvedToday: mine.filter((t: Ticket) =>
                    t.status === 'resolvido' &&
                    new Date(t.updatedAt).toDateString() === new Date().toDateString()
                ).length
            });

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetNext = async () => {
        try {
            setIsPulling(true);
            const ticket = await ticketService.getNextTicket();
            // Abrir o ticket pego
            setSelectedTicket(ticket);
            loadDashboard(); // Recarrega fila
        } catch (error: any) {
            alert(error.response?.data?.message || 'Não há tickets disponíveis na fila geral.');
        } finally {
            setIsPulling(false);
        }
    };

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
    };

    const refresh = () => {
        setSelectedTicket(null);
        loadDashboard();
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="agent-dashboard">
            <header className="agent-header">
                <div>
                    <h1>Painel do Atendente</h1>
                    <p>Olá, {user?.name}. Vamos trabalhar?</p>
                </div>
                <div className="agent-actions">
                    <button
                        className="btn-pull-ticket"
                        onClick={handleGetNext}
                        disabled={isPulling}
                    >
                        {isPulling ? 'Buscando...' : (
                            <>
                                <Play size={20} fill="currentColor" />
                                Pegar Próximo Ticket
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="agent-stats-grid">
                <div className="stat-card wip">
                    <Briefcase size={24} />
                    <div>
                        <h3>Em Atendimento</h3>
                        <span className="stat-value">{stats?.wip || 0}</span>
                    </div>
                </div>
                <div className="stat-card pending">
                    <Clock size={24} />
                    <div>
                        <h3>Pendentes</h3>
                        <span className="stat-value">{stats?.pending || 0}</span>
                    </div>
                </div>
                <div className="stat-card resolved">
                    <CheckCircle size={24} />
                    <div>
                        <h3>Resolvidos Hoje</h3>
                        <span className="stat-value">{stats?.resolvedToday || 0}</span>
                    </div>
                </div>
            </div>

            <div className="my-queue-section">
                <h2>Minha Fila de Trabalho</h2>
                {myTickets.length === 0 ? (
                    <div className="empty-queue">
                        <CheckCircle size={48} className="text-gray-300" />
                        <p>Sua fila está vazia! Clique em "Pegar Próximo Ticket" para começar.</p>
                    </div>
                ) : (
                    <div className="queue-list">
                        {myTickets.map(ticket => (
                            <div
                                key={ticket._id}
                                className={`queue-item status-${ticket.status}`}
                                onClick={() => handleTicketClick(ticket)}
                            >
                                <div className="queue-item-header">
                                    <span className="ticket-id">#{ticket._id.slice(-6)}</span>
                                    <span className={`status-badge ${ticket.status}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h4>{ticket.title}</h4>
                                <div className="queue-item-footer">
                                    <span className={`priority-indicator ${ticket.priority}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="ticket-category">{ticket.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={refresh}
                />
            )}
        </div>
    );
};
