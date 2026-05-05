import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';
import { useAuth } from '../context/AuthContext';
import {
    CheckCircle,
    FileText,
    Activity,
    RefreshCw,
    Eye,
    Plus,
    Filter,
    Search,
    ChevronDown,
    Users,
    User,
    UserCheck
} from 'lucide-react';
import api from '../services/api';
import './AgentMetrics.css';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import { TicketModal } from '../components/TicketModal';

interface AgentMetricsData {
    totalTickets: number;
    resolvedTickets: number;
    openTickets: number;
    slaBreachedTickets: number;
    avgResolutionTimeHours: number;
    avgFirstResponseTimeHours: number;
    availableInQueue: number;
}

export const AgentMetrics: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<AgentMetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [assignedTickets, setAssignedTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Estados de Filtro
    const [filterScope, setFilterScope] = useState<'mine' | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterAssignedTo, setFilterAssignedTo] = useState('');
    const [technicians, setTechnicians] = useState<any[]>([]);

    const loadTechnicians = async () => {
        try {
            const response = await api.get('/users');
            let usersList = [];
            if (Array.isArray(response.data)) {
                usersList = response.data;
            } else if (response.data?.data) {
                usersList = response.data.data;
            }
            // Filtrar apenas técnicos e admins
            const techList = usersList.filter((u: any) => u.role === 'tecnico' || u.role === 'admin');
            setTechnicians(techList);
        } catch (error) {
            console.error('Erro ao buscar técnicos:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const userId = user && (user._id || user.id);
            console.log('User for metrics:', user);

            const promises: Promise<any>[] = [ticketService.getAgentMetrics()];

            if (userId) {
                const params: any = {
                    status: filterStatus || 'aberto,em_andamento,pendente_cliente,pendente_interno',
                    priority: filterPriority || undefined,
                    category: filterCategory || undefined,
                    assignedTo: filterAssignedTo || undefined
                };

                // Se o escopo for "Meus Tickets", forçamos o filtro pelo ID do usuário
                if (filterScope === 'mine') {
                    params.assignedTo = userId;
                }

                promises.push(ticketService.getAll(params));
            } else {
                console.warn('User ID not found, skipping tickets fetch');
            }

            const results = await Promise.all(promises);
            const metricsData = results[0];
            const ticketsData = results[1];

            setMetrics(metricsData);
            if (ticketsData) {
                setAssignedTickets(ticketsData.data);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
            if (technicians.length === 0) {
                loadTechnicians();
            }
        } else {
            // Case where user might be null initially but we want to fail gracefully or wait
            // But if we are here, we are likely authenticated.
            // If user is null, checking localStorage manually as fallback or just stop loading.
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                // Context will eventually update.
            } else {
                setLoading(false);
            }
        }
    }, [user, filterScope, filterStatus, filterPriority, filterCategory, filterAssignedTo]);

    const handleViewTicket = (ticket: any) => {
        setSelectedTicket(ticket);
        setShowDetailsModal(true);
    };

    const handleModalClose = () => {
        setShowDetailsModal(false);
        setSelectedTicket(null);
        if (user) loadData();
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <span className="ml-2 text-gray-600">Carregando dados...</span>
            </div>
        );
    }

    if (!metrics) return null;

    const cards = [
        {
            title: 'Total de Tickets',
            value: metrics.totalTickets,
            icon: FileText,
            iconClass: 'icon-blue',
            description: 'Tickets atribuídos a você'
        },
        {
            title: 'Resolvidos',
            value: metrics.resolvedTickets,
            icon: CheckCircle,
            iconClass: 'icon-green',
            description: 'Tickets finalizados com sucesso'
        },
        {
            title: 'Não Resolvidos',
            value: metrics.totalTickets - metrics.resolvedTickets,
            icon: Activity,
            iconClass: 'icon-yellow',
            description: 'Tickets pendentes de resolução'
        },
        {
            title: 'Tickets na Fila',
            value: metrics.availableInQueue || 0,
            icon: Activity,
            iconClass: 'icon-orange',
            description: 'Disponíveis para assumir'
        }
    ];

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            baixa: '#10b981',
            media: '#f59e0b',
            alta: '#ef4444',
            critica: '#9333ea'
        };
        return colors[priority] || '#64748b';
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            aberto: '#3b82f6',
            em_andamento: '#f59e0b',
            resolvido: '#10b981',
            fechado: '#64748b'
        };
        return colors[status] || '#64748b';
    };

    return (
        <div className="agent-metrics-container">
            <div className="metrics-header">
                <div className="metrics-title">
                    <h1>Área do Atendente</h1>
                    <p>Acompanhe seus indicadores e tickets</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="refresh-btn"
                        style={{ backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' }}
                    >
                        <Plus size={16} />
                        Novo Ticket
                    </button>
                    <button
                        onClick={loadData}
                        className="refresh-btn"
                    >
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="metrics-grid">
                {cards.map((card, index) => (
                    <div key={index} className="metric-card">
                        <div className="metric-card-header">
                            <div className={`icon-wrapper ${card.iconClass}`}>
                                <card.icon size={24} />
                            </div>
                            <span className="metric-value">{card.value}</span>
                        </div>
                        <h3 className="metric-title">{card.title}</h3>
                        <p className="metric-description">{card.description}</p>
                    </div>
                ))}
            </div>

            <div className="assigned-tickets-section">
                <div className="section-header">
                    <h2 className="section-title">{filterScope === 'mine' ? 'Meus Tickets' : 'Tickets Disponíveis'}</h2>
                    <div className="actions-wrapper">
                        <div className="filters-bar">
                            <button
                                className={`toggle-btn ${filterScope === 'all' && !filterAssignedTo ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterScope('all');
                                    setFilterAssignedTo('');
                                }}
                            >
                                <Users size={14} />
                                Todos
                            </button>
                            <button
                                className={`toggle-btn ${filterScope === 'mine' || filterAssignedTo === (user?._id || user?.id) ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterScope('mine');
                                    setFilterAssignedTo(user?._id || user?.id || '');
                                }}
                            >
                                <User size={14} />
                                Só os Meus
                            </button>
                        </div>

                        <div className="filter-item">
                            <UserCheck size={16} />
                            <select
                                value={filterAssignedTo}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterAssignedTo(val);
                                    if (val === (user?._id || user?.id)) {
                                        setFilterScope('mine');
                                    } else if (val) {
                                        setFilterScope('all');
                                    }
                                }}
                            >
                                <option value="">Atendente (Todos)</option>
                                <option value="unassigned">Sem Atendente (Fila)</option>
                                {technicians.map(tech => (
                                    <option key={tech._id} value={tech._id}>{tech.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-item">
                            <Filter size={16} />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="">Status (Todos)</option>
                                <option value="aberto">Aberto</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="pendente_cliente">Pendente Usuário</option>
                                <option value="pendente_interno">Pendente Interno</option>
                                <option value="resolvido">Resolvido</option>
                                <option value="fechado">Fechado</option>
                            </select>
                        </div>

                        <div className="filter-item">
                            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                <option value="">Prioridade (Todas)</option>
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>

                        <div className="filter-item">
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                <option value="">Categoria (Todas)</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Software">Software</option>
                                <option value="Rede">Rede</option>
                                <option value="Acesso">Acesso</option>
                                <option value="SISTEC">SISTEC</option>
                                <option value="E-mail">E-mail</option>
                                <option value="Impressora">Impressora</option>
                                <option value="Telefonia">Telefonia</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="tickets-table-container">
                    {assignedTickets.length > 0 ? (
                        <table className="tickets-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Prioridade</th>
                                    <th>Status</th>
                                    <th>Solicitante</th>
                                    <th>Criado em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedTickets.map((ticket) => (
                                    <tr key={ticket._id}>
                                        <td>#{ticket._id.slice(-6)}</td>
                                        <td>
                                            <div className="ticket-title-cell">
                                                <strong>{ticket.title}</strong>
                                                {(!ticket.assignedTo || ticket.assignedTo.length === 0) && (
                                                    <span className="queue-badge">NA FILA</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`priority-badge ${ticket.priority}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${ticket.status}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{ticket.requester?.name || ticket.contactName || 'N/A'}</td>
                                        <td>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleViewTicket(ticket)}
                                                title="Ver detalhes"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Você não tem tickets atribuídos no momento.</p>
                        </div>
                    )}
                </div>
            </div>

            {showDetailsModal && selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={handleModalClose}
                />
            )}

            {showCreateModal && (
                <TicketModal
                    ticket={null}
                    onClose={() => {
                        setShowCreateModal(false);
                        if (user) loadData();
                    }}
                />
            )}
        </div>
    );
};
