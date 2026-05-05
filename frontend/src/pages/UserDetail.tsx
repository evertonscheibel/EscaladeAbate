import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    User, KeyRound, Shield, ChevronLeft, Save,
    UserX, UserCheck, Key, Clock, Info,
    Lock, Unlock, Download, Settings, Eye,
    Plus, Edit2, Trash2, Check, X, AlertTriangle, MapPin, Copy
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
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

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
            const payload = { ...formData };
            if (payload.department === '') payload.department = null;
            if (payload.permissionProfileId === '') payload.permissionProfileId = null;

            await userService.update(id, payload);
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
        try {
            console.log('Iniciando reset de senha para:', id);
            const { data } = await userService.resetPassword(id!);
            console.log('Resposta do reset:', data);
            setTempPassword(data.data.tempPassword);
            setShowResetConfirm(false);
        } catch (error: any) {
            console.error('Erro ao resetar senha:', error);
            alert('Erro ao resetar senha: ' + (error.response?.data?.message || error.message));
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
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <button className="btn-icon sm" onClick={() => navigate('/users')} style={{ marginRight: '12px' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <h1>{isNew ? 'Novo Usuário' : user?.name}</h1>
                        {!isNew && (
                            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                <span className={`status-badge status-${user?.active ? 'resolvido' : 'aberto'}`}>
                                    {user?.active ? 'Ativo' : 'Inativo'}
                                </span>
                                <span className="access-type-tag" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                    {formData.role.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <p>{isNew ? 'Cadastro de nova identidade no sistema' : 'Gestão de perfil, acessos e auditoria de segurança'}</p>
                </div>
                {isNew && (
                    <div className="header-actions">
                        <button className="btn-primary" onClick={handleCreateUser} disabled={saving}>
                            <Save size={20} /> Criar Usuário
                        </button>
                    </div>
                )}
            </header>

            <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="detail-tabs" style={{ marginBottom: 0, padding: '0 24px', background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                    <button
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                        style={{ borderBottom: activeTab === 'info' ? '2px solid var(--primary)' : 'none', padding: '16px 20px', borderRadius: 0, background: 'none' }}
                    >
                        <User size={18} /> Dados do Colaborador
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'access' ? 'active' : ''}`}
                        onClick={() => setActiveTab('access')}
                        style={{ borderBottom: activeTab === 'access' ? '2px solid var(--primary)' : 'none', padding: '16px 20px', borderRadius: 0, background: 'none' }}
                    >
                        <KeyRound size={18} /> Acesso
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('permissions')}
                        style={{ borderBottom: activeTab === 'permissions' ? '2px solid var(--primary)' : 'none', padding: '16px 20px', borderRadius: 0, background: 'none' }}
                    >
                        <Shield size={18} /> Permissões
                    </button>
                </div>

                <div className="tab-content" style={{ padding: '32px', border: 'none', boxShadow: 'none' }}>
                    {activeTab === 'info' && (
                        <div className="tab-pane">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nome Completo *</label>
                                    <input name="name" value={formData.name} onChange={handleInputChange} className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label>Email Corporativo *</label>
                                    <input name="email" value={formData.email} onChange={handleInputChange} className="form-control" disabled={!isNew} required />
                                </div>
                                <div className="form-group">
                                    <label>Departamento</label>
                                    <select name="department" value={formData.department} onChange={handleInputChange} className="form-control">
                                        <option value="">Selecione...</option>
                                        {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Cargo / Função</label>
                                    <input name="position" value={formData.position} onChange={handleInputChange} className="form-control" placeholder="Ex: Analista de TI" />
                                </div>
                                <div className="form-group">
                                    <label>Telefone / Ramal</label>
                                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Matrícula (RE)</label>
                                    <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="form-control" />
                                </div>
                            </div>
                            {!isNew && (
                                <button className="btn-primary" onClick={handleSaveInfo} disabled={saving} style={{ marginTop: '24px' }}>
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
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="form-control">
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Perfil de Permissões</label>
                                    <select
                                        name="permissionProfileId"
                                        value={formData.permissionProfileId}
                                        onChange={(e) => applyProfile(e.target.value)}
                                        className="form-control"
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
                                    <div className="access-summary-card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 800 }}>ÚLTIMO ACESSO</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                                {user?.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm:ss') : 'Nunca acessou'}
                                            </div>
                                        </div>
                                        {!showResetConfirm ? (
                                            <button className="btn-secondary sm" onClick={() => setShowResetConfirm(true)}>
                                                <Key size={18} /> Resetar Senha
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-primary sm" style={{ background: 'var(--danger)' }} onClick={handleResetPassword}>
                                                    Confirmar Reset
                                                </button>
                                                <button className="btn-secondary sm" onClick={() => setShowResetConfirm(false)}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {copySuccess && (
                                        <div style={{ 
                                            position: 'fixed', 
                                            bottom: '24px', 
                                            right: '24px', 
                                            background: '#10B981', 
                                            color: 'white', 
                                            padding: '12px 24px', 
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                            zIndex: 1000,
                                            animation: 'slideIn 0.3s ease-out'
                                        }}>
                                            Senha copiada com sucesso!
                                        </div>
                                    )}

                                    {tempPassword && (
                                        <div className="reset-password-modal" style={{ 
                                            background: 'rgba(245, 158, 11, 0.05)', 
                                            padding: '24px', 
                                            borderRadius: '24px', 
                                            border: '2px dashed var(--warning)', 
                                            marginBottom: '32px',
                                            textAlign: 'center',
                                            animation: 'slideIn 0.3s ease-out'
                                        }}>
                                            <div style={{ color: 'var(--warning)', fontWeight: 800, marginBottom: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <AlertTriangle size={20} /> SENHA TEMPORÁRIA GERADA
                                            </div>
                                            <div className="temp-password-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                                                <div className="temp-password-box" style={{ 
                                                    background: 'white', 
                                                    letterSpacing: '4px', 
                                                    fontSize: '2rem', 
                                                    padding: '12px 24px',
                                                    borderRadius: '12px',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    border: '1px solid var(--border)',
                                                    fontFamily: 'monospace',
                                                    fontWeight: 800
                                                }}>
                                                    {tempPassword}
                                                </div>
                                                <button 
                                                    className="btn-icon" 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(tempPassword);
                                                        setCopySuccess(true);
                                                        setTimeout(() => setCopySuccess(false), 3000);
                                                    }}
                                                    title="Copiar Senha"
                                                    style={{ width: '48px', height: '48px' }}
                                                >
                                                    <Copy size={20} />
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                                                Esta senha será mostrada <strong>apenas uma vez</strong>. Forneça ao usuário com cautela e peça para alterá-la no primeiro acesso.
                                            </p>
                                        </div>
                                    )}

                                    <div className="login-history">
                                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 800 }}>
                                            Histórico de Sessões
                                        </h4>
                                        <div className="table-container">
                                            <table className="ivory-table premium-table">
                                                <thead>
                                                    <tr>
                                                        <th>DATA/HORA</th>
                                                        <th>IP</th>
                                                        <th>LOCALIZAÇÃO</th>
                                                        <th>AGENTE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {user?.loginHistory?.map((h, i) => (
                                                        <tr key={i}>
                                                            <td className="datetime-cell">
                                                                <span className="date">{format(new Date(h.at), 'dd/MM/yy')}</span>
                                                                <span className="time">{format(new Date(h.at), 'HH:mm')}</span>
                                                            </td>
                                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{h.ip}</td>
                                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} /> Brazil, MS</div></td>
                                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.userAgent.substring(0, 50)}...</td>
                                                        </tr>
                                                    )) || <tr><td colSpan={4} className="empty-state">Nenhum histórico disponível</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!isNew && (
                                <button className="btn-primary" onClick={handleSaveInfo} disabled={saving} style={{ marginTop: '24px' }}>
                                    <Save size={18} /> Salvar Dados de Acesso
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="tab-pane">
                            <div className="profile-selection-banner" style={{ border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                                <div className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={32} />
                                </div>
                                <div className="banner-info">
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>PERFIL ATUAL</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)' }}>
                                        {formData.permissionProfileId ?
                                            profiles.find(p => p._id === formData.permissionProfileId)?.name :
                                            'Personalizado'
                                        }
                                    </div>
                                </div>
                                {user?.hasCustomPermissions && (
                                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '8px', padding: '6px 12px', fontWeight: 800, fontSize: '11px' }}>
                                        COM CUSTOMIZAÇÕES
                                    </span>
                                )}
                            </div>

                            <div className="permissions-header-actions" style={{ marginTop: '32px' }}>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>Matriz de Permissões</h3>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn-secondary sm" onClick={() => setPermissions({})}>
                                        <Trash2 size={16} /> Limpar Customizações
                                    </button>
                                </div>
                            </div>

                            <div className="table-container" style={{ marginTop: '16px' }}>
                                <table className="ivory-table premium-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', width: '280px' }}>MÓDULO</th>
                                            {ALL_ACTIONS.map(action => (
                                                <th key={action.slug} className="text-center">
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                                        {React.createElement((LucideIcons as any)[action.icon] || Info, { size: 16 })}
                                                        <span style={{ fontSize: '10px' }}>{action.label}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_MODULES.map(module => {
                                            const isAllowed = formData.allowedModules.includes(module.slug);
                                            const currentM = permissions[module.slug] || null;
                                            const effectiveM = effectivePermissions[module.slug] || [];

                                            return (
                                                <tr key={module.slug} style={{ opacity: isAllowed ? 1 : 0.6 }}>
                                                    <td className="perm-module-name">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '8px',
                                                                background: isAllowed ? 'var(--primary-soft)' : 'var(--surface-2)',
                                                                color: isAllowed ? 'var(--primary)' : 'var(--text-muted)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                {React.createElement((LucideIcons as any)[module.icon] || Shield, { size: 18 })}
                                                            </div>
                                                            <span style={{ fontWeight: 700 }}>{module.label}</span>
                                                        </div>
                                                    </td>
                                                    {ALL_ACTIONS.map(action => {
                                                        const applicable = isActionApplicable(module.slug, action.slug);
                                                        if (!applicable) return <td key={action.slug} className="text-center"><span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>—</span></td>;

                                                        const isEffective = effectiveM.includes(action.slug);
                                                        const isCustomSet = currentM?.includes(action.slug);
                                                        const finalVal = currentM ? isCustomSet : isEffective;
                                                        const isCustomized = currentM !== null && isCustomSet !== isEffective;

                                                        return (
                                                            <td key={action.slug} className="text-center" style={{ position: 'relative' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!finalVal}
                                                                    onChange={() => togglePermission(module.slug, action.slug)}
                                                                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                                />
                                                                {isCustomized && (
                                                                    <div title="Customizado" style={{ position: 'absolute', top: '2px', right: '2px' }}>
                                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }}></div>
                                                                    </div>
                                                                )}
                                                                {!currentM && isEffective && (
                                                                    <div title="Perfil" style={{ position: 'absolute', top: '2px', right: '2px' }}>
                                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
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
                                <div style={{ marginTop: '32px' }}>
                                    <button className="btn-primary" onClick={handleSavePermissions} disabled={saving}>
                                        <Save size={18} /> Salvar Permissões
                                    </button>

                                    <div className="audit-timeline" style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
                                        <h4 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 800 }}>
                                            Audit Log de Permissões
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            {auditLogs.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma alteração registrada.</p>
                                            ) : (
                                                auditLogs.map(log => (
                                                    <div className="timeline-item" key={log._id} style={{ position: 'relative', paddingLeft: '40px' }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            left: '0',
                                                            top: '4px',
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '50%',
                                                            background: 'white',
                                                            border: `3px solid ${log.action.includes('CREATED') ? 'var(--success)' : 'var(--primary)'}`,
                                                            zIndex: 2
                                                        }}></div>
                                                        {auditLogs.indexOf(log) !== auditLogs.length - 1 && (
                                                            <div style={{ position: 'absolute', left: '7px', top: '20px', bottom: '-20px', width: '2px', background: 'var(--border)' }}></div>
                                                        )}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                                {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')} • {log.changedByName}
                                                            </div>
                                                            <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                                <strong style={{ color: 'var(--text)', textTransform: 'uppercase', fontSize: '10px' }}>{log.action.replace(/_/g, ' ')}:</strong>
                                                                <span style={{ marginLeft: '8px' }}>{log.details}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
