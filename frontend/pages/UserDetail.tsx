import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    User, KeyRound, Shield, ChevronLeft, Save,
    UserX, UserCheck, Key, Clock, Info,
    Lock, Unlock, Download, Settings, Eye,
    Plus, Edit2, Trash2, Check, X, AlertTriangle, MapPin
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { userService, permissionProfileService } from '../services/userService';
import {
    UserDetail as UserDetailType, PermissionProfile,
    ALL_MODULES, ALL_ACTIONS, DEPARTMENTS, ROLES
} from '../types/user';
import { format } from 'date-fns';
import './UserDetail.css';

export const UserDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserDetailType | null>(null);
    const [profiles, setProfiles] = useState<PermissionProfile[]>([]);
    const [activeTab, setActiveTab] = useState('info');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // Estados locais para edição
    const [formData, setFormData] = useState<any>({
        name: '', email: '', department: '', position: '', phone: '', employeeId: '',
        role: 'cliente', permissionProfileId: '', allowedModules: ['dashboard'],
        mustChangePassword: true, active: true
    });

    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [effectivePermissions, setEffectivePermissions] = useState<Record<string, string[]>>({});
    const [tempPassword, setTempPassword] = useState<string | null>(null);

    useEffect(() => {
        if (location.hash === '#permissions') setActiveTab('permissions');
        else if (location.hash === '#access') setActiveTab('access');

        fetchProfiles();
        if (!isNew && id) {
            fetchUser(id);
            fetchAudit(id);
        }
    }, [id, isNew, location.hash]);

    const fetchUser = async (userId: string) => {
        try {
            const { data } = await userService.getById(userId);
            const u = data.data.user;
            setUser(u);
            setFormData({
                name: u.name,
                email: u.email,
                department: u.department || '',
                position: u.position || '',
                phone: u.phone || '',
                employeeId: u.employeeId || '',
                role: u.role,
                permissionProfileId: u.permissionProfile?._id || '',
                allowedModules: u.allowedModules || ['dashboard'],
                mustChangePassword: u.mustChangePassword,
                active: u.active
            });
            setPermissions(u.permissions || {});
            setEffectivePermissions(data.data.effectivePermissions || {});
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
        } finally {
            setLoading(false);
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

    const fetchAudit = async (userId: string) => {
        try {
            const { data } = await userService.getAuditLog(userId);
            setAuditLogs(data.data);
        } catch (error) {
            console.error('Erro ao buscar auditoria:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as any).checked : value
        }));
    };

    const handleSaveInfo = async () => {
        if (!id) return;
        try {
            setSaving(true);
            await userService.update(id, formData);
            alert('Dados atualizados com sucesso!');
            if (!isNew) fetchUser(id);
        } catch (error: any) {
            alert('Erro ao salvar: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleSavePermissions = async () => {
        if (!id) return;
        try {
            setSaving(true);
            await userService.updatePermissions(id, {
                permissionProfileId: formData.permissionProfileId,
                permissions: permissions,
                allowedModules: formData.allowedModules
            });
            alert('Permissões atualizadas!');
            fetchUser(id);
            fetchAudit(id);
        } catch (error) {
            alert('Erro ao salvar permissões');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            setSaving(true);
            const { data } = await userService.create({
                ...formData,
                permissions
            });
            alert('Usuário criado!');
            navigate(`/users/${data.data._id}`);
        } catch (error: any) {
            alert('Erro ao criar: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!id || !window.confirm('Deseja resetar a senha deste usuário?')) return;
        try {
            const { data } = await userService.resetPassword(id);
            setTempPassword(data.data.tempPassword);
        } catch (error) {
            alert('Erro ao resetar senha');
        }
    };

    // Lógica para o Grid de Permissões
    const togglePermission = (module: string, action: string) => {
        const currentM = permissions[module] || [];
        let nextM: string[];

        if (currentM.includes(action)) {
            nextM = currentM.filter(a => a !== action);
        } else {
            nextM = [...currentM, action];
        }

        const newPermissions = { ...permissions, [module]: nextM };
        setPermissions(newPermissions);

        // Ativar o módulo no allowedModules se houver qualquer permissão
        if (nextM.length > 0 && !formData.allowedModules.includes(module)) {
            setFormData((prev: any) => ({
                ...prev,
                allowedModules: [...prev.allowedModules, module]
            }));
        }
    };

    const applyProfile = (profileId: string) => {
        const profile = profiles.find(p => p._id === profileId);
        if (!profile) return;

        setFormData((prev: any) => ({
            ...prev,
            permissionProfileId: profileId,
            allowedModules: profile.modules,
            role: profile.defaultRole
        }));
        setPermissions({}); // Limpa customizações ao aplicar perfil
    };

    const isActionApplicable = (module: string, action: string) => {
        if (module === 'cofre' && ['close', 'reopen'].includes(action)) return false;
        if (module === 'noc' && action !== 'view') return false;
        return true;
    };

    if (loading) return <div className="user-detail-container">Carregando...</div>;

    return (
        <div className="user-detail-container">
            <header className="user-detail-header">
                <div className="user-header-info">
                    <button className="btn-back" onClick={() => navigate('/users')}>
                        <ChevronLeft size={20} /> Voltar
                    </button>
                    <h1>{isNew ? 'Novo Usuário' : user?.name}</h1>
                    {!isNew && (
                        <>
                            <span className={`badge ${user?.active ? 'badge-success' : 'badge-danger'}`} style={{ background: user?.active ? '#e8f5e9' : '#ffebee', color: user?.active ? '#2e7d32' : '#c62828' }}>
                                {user?.active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="badge badge-role">
                                {formData.role.toUpperCase()}
                            </span>
                        </>
                    )}
                </div>
                {isNew && (
                    <button className="btn-save-section" onClick={handleCreateUser} disabled={saving} style={{ marginTop: 0 }}>
                        <Save size={20} /> Criar Usuário
                    </button>
                )}
            </header>

            <div className="detail-tabs">
                <button
                    className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    <User size={18} /> Dados do Colaborador
                </button>
                <button
                    className={`tab-btn ${activeTab === 'access' ? 'active' : ''}`}
                    onClick={() => setActiveTab('access')}
                >
                    <KeyRound size={18} /> Acesso
                </button>
                <button
                    className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('permissions')}
                >
                    <Shield size={18} /> Permissões
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'info' && (
                    <div className="tab-pane">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nome Completo *</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Email Corporativo *</label>
                                <input name="email" value={formData.email} onChange={handleInputChange} disabled={!isNew} required />
                            </div>
                            <div className="form-group">
                                <label>Departamento</label>
                                <select name="department" value={formData.department} onChange={handleInputChange}>
                                    <option value="">Selecione...</option>
                                    {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cargo / Função</label>
                                <input name="position" value={formData.position} onChange={handleInputChange} placeholder="Ex: Analista de TI" />
                            </div>
                            <div className="form-group">
                                <label>Telefone / Ramal</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Matrícula (RE)</label>
                                <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} />
                            </div>
                        </div>
                        {!isNew && (
                            <button className="btn-save-section" onClick={handleSaveInfo} disabled={saving}>
                                <Save size={18} /> Salvar Dados
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'access' && (
                    <div className="tab-pane">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Role (Perfil Base)</label>
                                <select name="role" value={formData.role} onChange={handleInputChange}>
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Perfil de Permissões</label>
                                <select
                                    name="permissionProfileId"
                                    value={formData.permissionProfileId}
                                    onChange={(e) => applyProfile(e.target.value)}
                                >
                                    <option value="">Nenhum (Customizado)</option>
                                    {profiles.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <input
                                    type="checkbox"
                                    id="mustChange"
                                    name="mustChangePassword"
                                    checked={formData.mustChangePassword}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="mustChange" style={{ textTransform: 'none', margin: 0 }}>Forçar troca de senha no próximo login</label>
                            </div>
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <input
                                    type="checkbox"
                                    id="actv"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="actv" style={{ textTransform: 'none', margin: 0 }}>Conta ativa</label>
                            </div>
                        </div>

                        {!isNew && (
                            <div className="access-info-section" style={{ marginTop: '40px' }}>
                                <div className="access-summary-card">
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>ÚLTIMO ACESSO</div>
                                        <div style={{ fontWeight: 600 }}>
                                            {user?.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm:ss') : 'Nunca acessou'}
                                        </div>
                                    </div>
                                    <button className="btn-back" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={handleResetPassword}>
                                        <Key size={18} /> Resetar Senha
                                    </button>
                                </div>

                                {tempPassword && (
                                    <div className="reset-password-modal">
                                        <div style={{ color: 'var(--warning)', fontWeight: 600, marginBottom: '8px' }}>SENHA TEMPORÁRIA GERADA</div>
                                        <div className="temp-password-box">{tempPassword}</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Esta senha será mostrada apenas uma vez. Forneça ao usuário.</p>
                                    </div>
                                )}

                                <div className="login-history">
                                    <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        Histórico de Sessões
                                    </h4>
                                    <table className="perm-table">
                                        <thead>
                                            <tr>
                                                <th>Data/Hora</th>
                                                <th>IP</th>
                                                <th>Localização (Simulada)</th>
                                                <th>Agente</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {user?.loginHistory?.map((h, i) => (
                                                <tr key={i}>
                                                    <td>{format(new Date(h.at), 'dd/MM/yy HH:mm')}</td>
                                                    <td style={{ fontFamily: 'monospace' }}>{h.ip}</td>
                                                    <td><MapPin size={12} /> Brazil, MS</td>
                                                    <td style={{ fontSize: '0.7rem' }}>{h.userAgent.substring(0, 40)}...</td>
                                                </tr>
                                            )) || <tr><td colSpan={4}>Nenhum histórico disponível</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {!isNew && (
                            <button className="btn-save-section" onClick={handleSaveInfo} disabled={saving}>
                                <Save size={18} /> Salvar Dados de Acesso
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div className="tab-pane">
                        <div className="profile-selection-banner">
                            <Shield size={32} color="var(--primary)" />
                            <div className="banner-info">
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>PERFIL ATUAL</div>
                                <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                                    {formData.permissionProfileId ?
                                        profiles.find(p => p._id === formData.permissionProfileId)?.name :
                                        'Personalizado'
                                    }
                                </div>
                            </div>
                            <div className="badge" style={{ background: '#e0e7ff', color: 'var(--primary)' }}>
                                {user?.hasCustomPermissions ? 'Com customizações' : 'Padrão do perfil'}
                            </div>
                        </div>

                        <div className="permissions-header-actions">
                            <h3 style={{ margin: 0 }}>Matriz de Permissões</h3>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn-back" onClick={() => setPermissions({})}>
                                    <Trash2 size={16} /> Limpar Customizações
                                </button>
                            </div>
                        </div>

                        <div className="perm-table-container">
                            <table className="perm-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', width: '240px' }}>Módulo</th>
                                        {ALL_ACTIONS.map(action => (
                                            <th key={action.slug}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                    {React.createElement((LucideIcons as any)[action.icon] || Info, { size: 14 })}
                                                    {action.label}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ALL_MODULES.map(module => {
                                        const isAllowed = formData.allowedModules.includes(module.slug);
                                        const profilePerms = formData.permissionProfileId ?
                                            profiles.find(p => p._id === formData.permissionProfileId)?.permissions[module.slug] || [] :
                                            [];
                                        const customPerms = permissions[module.slug] || null;

                                        return (
                                            <tr key={module.slug} style={{ opacity: isAllowed ? 1 : 0.6 }}>
                                                <td className="perm-module-name">
                                                    {React.createElement((LucideIcons as any)[module.icon] || Shield, { size: 18, color: isAllowed ? 'var(--primary)' : 'var(--text-light)' })}
                                                    {module.label}
                                                </td>
                                                {ALL_ACTIONS.map(action => {
                                                    const applicable = isActionApplicable(module.slug, action.slug);
                                                    if (!applicable) return <td key={action.slug} className="perm-cell"><span className="not-applicable">—</span></td>;

                                                    const isProfileSet = profilePerms.includes(action.slug);
                                                    const isCustomSet = customPerms?.includes(action.slug);
                                                    const effectiveSet = customPerms ? isCustomSet : isProfileSet;
                                                    const isCustomized = customPerms !== null && isCustomSet !== isProfileSet;

                                                    return (
                                                        <td
                                                            key={action.slug}
                                                            className={`perm-cell ${customPerms ? 'customized' : ''} ${!customPerms && isProfileSet ? 'from-profile' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={!!effectiveSet}
                                                                onChange={() => togglePermission(module.slug, action.slug)}
                                                            />
                                                            {isCustomized && (
                                                                <div className="perm-indicator" title="Customizado">
                                                                    <Edit2 size={8} color="var(--warning)" />
                                                                </div>
                                                            )}
                                                            {!customPerms && isProfileSet && (
                                                                <div className="perm-indicator" title="Vindo do Perfil">
                                                                    <Lock size={8} color="var(--primary)" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {!isNew && (
                            <>
                                <button className="btn-save-section" onClick={handleSavePermissions} disabled={saving}>
                                    <Save size={18} /> Salvar Permissões
                                </button>

                                <div className="audit-timeline">
                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                        Audit Log de Permissões
                                    </h4>
                                    {auditLogs.length === 0 ? (
                                        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Nenhuma alteração registrada.</p>
                                    ) : (
                                        auditLogs.map(log => (
                                            <div className="timeline-item" key={log._id}>
                                                <div className="timeline-dot" style={{ borderColor: log.action.includes('CREATED') ? 'var(--success)' : 'var(--primary)' }}></div>
                                                <div className="timeline-meta">
                                                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')} • {log.changedByName} ({log.ip})
                                                </div>
                                                <div className="timeline-content">
                                                    <strong>{log.action.replace(/_/g, ' ')}:</strong> {log.details}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
