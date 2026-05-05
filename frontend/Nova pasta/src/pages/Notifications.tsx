import React, { useEffect, useState } from 'react';
import { notificationService } from '../services';
import { Bell, Check, Trash2 } from 'lucide-react';
import '../pages/Tickets.css';

export const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationService.getAll();
            setNotifications(response.data);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            loadNotifications();
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            loadNotifications();
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando notificações...</p></div>;
    }

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Notificações</h1>
                    <p>{notifications.filter(n => !n.isRead).length} não lida(s)</p>
                </div>
                <button className="btn-primary" onClick={handleMarkAllAsRead}>
                    <Check size={20} />
                    Marcar Todas como Lidas
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {notifications.map((notification) => (
                    <div
                        key={notification._id}
                        style={{
                            background: notification.isRead ? '#f8fafc' : 'white',
                            padding: '20px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            borderLeft: `4px solid ${notification.priority === 'alta' ? '#ef4444' : notification.priority === 'media' ? '#f59e0b' : '#10b981'}`
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <Bell size={20} color="#667eea" />
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                                        {notification.type}
                                    </span>
                                    {!notification.isRead && (
                                        <span style={{ padding: '4px 8px', background: '#667eea', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                            Nova
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e293b', lineHeight: '1.6' }}>
                                    {notification.message}
                                </p>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>
                                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!notification.isRead && (
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleMarkAsRead(notification._id)}
                                        title="Marcar como lida"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div className="empty-state">
                        <p>Nenhuma notificação</p>
                    </div>
                )}
            </div>
        </div>
    );
};
