import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="user-mgmt-container">
            <header className="user-mgmt-header">
                <h1><Users size={32} /> Gestão de Usuários</h1>
                <button className="btn-new-user" onClick={() => navigate('/users/new')}>
                    <Plus size={20} /> Novo Usuário
                </button>
            </header>

            {stats && (
                <div className="user-mgmt-stats">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)', color: 'var(--primary)' }}>
                            <Users size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Usuários</h3>
                            <div className="value">{stats.totalUsers}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)' }}>
                            <UserCheck size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Ativos</h3>
                            <div className="value">{stats.activeUsers}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(244, 67, 54, 0.1)', color: 'var(--danger)' }}>
                            <UserX size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Inativos</h3>
                            <div className="value">{stats.inactiveUsers}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(255, 152, 0, 0.1)', color: 'var(--warning)' }}>
                            <Lock size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Bloqueados</h3>
                            <div className="value">{stats.lockedUsers}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="user-mgmt-filters">
                <div className="filter-group">
                    <label>Buscar</label>
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Nome, email ou matrícula..."
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label>Função</label>
                    <select name="role" value={filters.role} onChange={handleFilterChange}>
                        <option value="">Todas as funções</option>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Departamento</label>
                    <select name="department" value={filters.department} onChange={handleFilterChange}>
                        <option value="">Todos setores</option>
                        {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Status</label>
                    <select name="active" value={filters.active} onChange={handleFilterChange}>
                        <option value="true">Ativos</option>
                        <option value="false">Inativos</option>
                        <option value="">Todos</option>
                    </select>
                </div>

                <button className="btn-manage-profiles" onClick={() => navigate('/permission-profiles')}>
                    <Shield size={18} /> Perfis de Permissão
                </button>
            </div>

            <div className="user-mgmt-table-container">
                <table className="user-mgmt-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Cargo / Setor</th>
                            <th>Acesso</th>
                            <th>Perfil</th>
                            <th>Status / Último Login</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Carregando usuários...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Nenhum usuário encontrado.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="user-info-name">{user.name}</span>
                                                <span className="user-info-email">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{user.position || '-'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            {getDeptLabel(user.department || '')}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-role">
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        {user.permissionProfile ? (
                                            <span className="badge badge-profile" style={{ background: `${user.permissionProfile.color}15`, color: user.permissionProfile.color }}>
                                                <Shield size={12} /> {user.permissionProfile.name}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.75rem' }}>Personalizado</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="status-dot" style={{ background: user.active ? 'var(--success)' : 'var(--danger)' }}></span>
                                            {user.active ? 'Ativo' : 'Inativo'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                            {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yy HH:mm') : 'Nunca logou'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn" title="Editar Usuário" onClick={() => navigate(`/users/${user._id}`)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="action-btn" title="Permissões" onClick={() => navigate(`/users/${user._id}#permissions`)}>
                                                <Shield size={16} />
                                            </button>
                                            <button className="action-btn" title="Resetar Senha" onClick={() => navigate(`/users/${user._id}#access`)}>
                                                <Key size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="pagination">
                    <div className="pagination-info">
                        Exibindo {users.length} de {pagination.total} usuários
                    </div>
                    <div className="pagination-btns">
                        <button
                            className="pagination-btn"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="pagination-btn"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
