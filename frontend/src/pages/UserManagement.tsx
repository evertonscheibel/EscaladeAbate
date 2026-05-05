import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Users, UserCheck, UserX, Lock, Shield,
    Search, Filter, Plus, Edit2, Key,
    MoreVertical, ChevronLeft, ChevronRight,
    Briefcase, Building2, MapPin
} from 'lucide-react';
import { userService, permissionProfileService } from '../services/userService';
import { UserListItem, UserStats, ROLES, DEPARTMENTS } from '../types/user';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './UserManagement.css';

export const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

    // Filtros
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        department: '',
        active: 'true',
        profileId: ''
    });

    const [profiles, setProfiles] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchProfiles();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, pagination.page]);

    const fetchStats = async () => {
        try {
            const { data } = await userService.getStats();
            setStats(data.data);
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
        }
    };

    const fetchProfiles = async () => {
        try {
            const { data } = await permissionProfileService.getAll();
            setProfiles(data.data);
        } catch (error) {
            console.error('Erro ao buscar perfis:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            };
            const { data } = await userService.getAll(params);
            setUsers(data.data);
            setPagination(prev => ({
                ...prev,
                total: data.total || 0,
                pages: data.pages || 1
            }));
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const getRoleLabel = (roleValue: string) => {
        return ROLES.find(r => r.value === roleValue)?.label || roleValue;
    };

    const getDeptLabel = (deptValue: string) => {
        return DEPARTMENTS.find(d => d.value === deptValue)?.label || deptValue;
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <div className="header-icon">
                            <Users size={28} />
                        </div>
                        <h1>Gestão de Usuários</h1>
                    </div>
                    <p>Administração de contas, perfis de acesso e governança de identidade</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/permission-profiles')}>
                        <Shield size={20} /> Perfis de Permissão
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/users/new')}>
                        <Plus size={20} /> Novo Usuário
                    </button>
                </div>
            </header>

            {stats && (
                <div className="reports-kpi-grid">
                    <div className="analysis-card kpi">
                        <div className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                            <Users size={32} />
                        </div>
                        <div className="kpi-info">
                            <h4>Total de Colaboradores</h4>
                            <span className="value">{stats.totalUsers}</span>
                        </div>
                    </div>
                    <div className="analysis-card kpi">
                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <UserCheck size={32} />
                        </div>
                        <div className="kpi-info">
                            <h4>Usuários Ativos</h4>
                            <span className="value">{stats.activeUsers}</span>
                        </div>
                    </div>
                    <div className="analysis-card kpi">
                        <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                            <UserX size={32} />
                        </div>
                        <div className="kpi-info">
                            <h4>Contas Inativas</h4>
                            <span className="value">{stats.inactiveUsers}</span>
                        </div>
                    </div>
                    <div className="analysis-card kpi">
                        <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                            <Lock size={32} />
                        </div>
                        <div className="kpi-info">
                            <h4>Acessos Bloqueados</h4>
                            <span className="value">{stats.lockedUsers}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="content-card">
                <div className="filter-bar">
                    <div className="search-input-wrapper">
                        <div className="input-with-icon sm">
                            <Search size={18} />
                            <input
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Nome, email ou matrícula..."
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="tabs-container">
                        <div className="form-group sm" style={{ marginBottom: 0 }}>
                            <select name="role" value={filters.role} onChange={handleFilterChange} className="form-control sm">
                                <option value="">Todas Funções</option>
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group sm" style={{ marginBottom: 0 }}>
                            <select name="department" value={filters.department} onChange={handleFilterChange} className="form-control sm">
                                <option value="">Todos Setores</option>
                                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group sm" style={{ marginBottom: 0 }}>
                            <select name="active" value={filters.active} onChange={handleFilterChange} className="form-control sm">
                                <option value="true">Ativos</option>
                                <option value="false">Inativos</option>
                                <option value="">Todos</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="ivory-table premium-table">
                        <thead>
                            <tr>
                                <th>USUÁRIO / IDENTIDADE</th>
                                <th>CARGO / SETOR</th>
                                <th className="text-center">ACESSO</th>
                                <th className="text-center">PERFIL</th>
                                <th className="text-center">STATUS / ÚLTIMO LOGIN</th>
                                <th className="text-right">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="empty-state">Sincronizando base de usuários...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="empty-state">Nenhum usuário localizado.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar" style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: user.active ? 'var(--primary-soft)' : 'var(--surface-2)',
                                                    color: user.active ? 'var(--primary)' : 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-details">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-sub">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="status-cell-stacked">
                                                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{user.position || '-'}</span>
                                                <span className="user-sub" style={{ fontSize: '0.75rem' }}>
                                                    {getDeptLabel(user.department || '')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="access-type-tag" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {user.permissionProfile ? (
                                                <span className="badge" style={{
                                                    background: `${user.permissionProfile.color}15`,
                                                    color: user.permissionProfile.color,
                                                    border: `1px solid ${user.permissionProfile.color}30`,
                                                    borderRadius: '8px',
                                                    padding: '4px 10px',
                                                    fontSize: '11px',
                                                    fontWeight: 800
                                                }}>
                                                    <Shield size={10} style={{ marginRight: '6px' }} /> {user.permissionProfile.name}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>Personalizado</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="datetime-cell" style={{ alignItems: 'center' }}>
                                                <span className={`status-badge status-${user.active ? 'resolvido' : 'aberto'}`}>
                                                    {user.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                                <span className="time">
                                                    {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yy HH:mm', { locale: ptBR }) : 'Sem registros'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                                                <Link 
                                                    to={`/users/${user._id}`} 
                                                    className="btn-icon" 
                                                    title="Editar Usuário"
                                                >
                                                    <Edit2 size={16} />
                                                </Link>
                                                <Link 
                                                    to={`/users/${user._id}#permissions`} 
                                                    className="btn-icon" 
                                                    style={{ color: 'var(--success)' }}
                                                    title="Ver Permissões"
                                                >
                                                    <Shield size={16} />
                                                </Link>
                                                <Link 
                                                    to={`/users/${user._id}#access`} 
                                                    className="btn-icon" 
                                                    style={{ color: 'var(--warning)' }}
                                                    title="Segurança e Senha"
                                                >
                                                    <Key size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="table-pagination-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="table-info">
                            Exibindo <strong>{users.length}</strong> de <strong>{pagination.total}</strong> colaboradores
                        </div>
                        <div className="table-pagination" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button
                                className="btn-secondary sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="page-indicator">Página <strong>{pagination.page}</strong> de <strong>{pagination.pages}</strong></span>
                            <button
                                className="btn-secondary sm"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
