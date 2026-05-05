import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';
import {
    Circle,
    CheckCircle,
    Clock,
    UserPlus,
    Play,
    Pause,
    AlertTriangle,
    MessageSquare,
    Check
} from 'lucide-react';
import './TicketTimeline.css';

interface TimelineEvent {
    _id: string;
    type: string;
    at: string;
    byUser: {
        name: string;
        role: string;
    };
    data?: any;
}

interface TicketTimelineProps {
    ticketId: string;
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({ ticketId }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [ticketId]);

    const loadEvents = async () => {
        try {
            const data = await ticketService.getEvents(ticketId);
            setEvents(data);
        } catch (error) {
            console.error('Erro ao carregar timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'CREATED': return <Circle size={16} />;
            case 'ASSIGNED': return <UserPlus size={16} />;
            case 'ACCEPTED': return <Check size={16} />;
            case 'WORK_STARTED': return <Play size={16} />;
            case 'PENDING_CUSTOMER':
            case 'PENDING_INTERNAL': return <Pause size={16} />;
            case 'RESOLVED': return <CheckCircle size={16} />;
            case 'CLOSED': return <CheckCircle size={16} fill="currentColor" />;
            case 'REOPENED': return <AlertTriangle size={16} />;
            case 'COMMENT_ADDED': return <MessageSquare size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'CREATED': return 'text-blue-500 bg-blue-100';
            case 'ASSIGNED': return 'text-purple-500 bg-purple-100';
            case 'WORK_STARTED': return 'text-amber-500 bg-amber-100';
            case 'RESOLVED': return 'text-emerald-500 bg-emerald-100';
            case 'CLOSED': return 'text-gray-500 bg-gray-100';
            default: return 'text-slate-500 bg-slate-100';
        }
    };

    const formatEventMessage = (event: TimelineEvent) => {
        switch (event.type) {
            case 'CREATED': return 'Ticket criado';
            case 'ASSIGNED': return `Atribuído para ${event.data?.assignedToName || 'técnico'}`;
            case 'ACCEPTED': return 'Aceitou o ticket';
            case 'WORK_STARTED': return 'Iniciou o atendimento';
            case 'PENDING_CUSTOMER': return `Aguardando cliente: ${event.data?.reason || ''}`;
            case 'PENDING_INTERNAL': return `Pendente interno: ${event.data?.reason || ''}`;
            case 'RESOLVED': return 'Ticket resolvido';
            case 'CLOSED': return 'Ticket fechado';
            case 'REOPENED': return 'Ticket reaberto';
            case 'COMMENT_ADDED': return 'Comentou';
            default: return event.type;
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Carregando histórico...</div>;

    if (events.length === 0) return null;

    return (
        <div className="ticket-timeline">
            {events.map((event, index) => (
                <div key={event._id} className="timeline-item">
                    <div className="timeline-line"></div>
                    <div className={`timeline-icon ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <span className="event-message font-medium">
                                {formatEventMessage(event)}
                            </span>
                            <span className="event-time text-xs text-gray-400">
                                {new Date(event.at).toLocaleString('pt-BR')}
                            </span>
                        </div>
                        <div className="event-user text-xs text-gray-500">
                            por {event.byUser?.name || 'Sistema'}
                        </div>
                        {event.data?.comment && (
                            <div className="event-comment mt-1 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                "{event.data.comment}"
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
