import React, { useState, useEffect } from 'react';
import {
    Check, X, Info, Search, AlertTriangle,
    LayoutDashboard, Ticket, BookOpen, FileText,
    Beef, CalendarDays, Users, Briefcase, DoorOpen,
    Monitor, Network, Lock, Activity, Settings,
    HardHat, Crown, Eye, Unlock, Download,
    ShoppingCart, Wrench, AlertCircle, Save, Edit2, Plus, Shield, Trash2,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { permissionProfileService } from '../services/userService';
import { PermissionProfile, ALL_MODULES, ALL_ACTIONS, ROLES } from '../types/user';
import './PermissionProfiles.css';

export const PermissionProfiles: React.FC = () => {
    const [profiles, setProfiles] = useState<PermissionProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Partial<PermissionProfile> | null>(null);

    const colors = ['#667eea', '#764ba2', '#ff9800', '#f44336', '#4caf50', '#9c27b0', '#607d8b'];

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data } = await permissionProfileService.getAll();
            setProfiles(data.data);
        } catch (error) {
            console.error('Erro ao buscar perfis:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingProfile({
            name: '',
            description: '',
            color: '#667eea',
            icon: 'Shield',
            defaultRole: 'cliente',
            modules: ['dashboard'],
            permissions: { 'dashboard': ['view'] }
        });
        setShowModal(true);
    };

    const handleEdit = (profile: PermissionProfile) => {
        setEditingProfile({ ...profile });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const profile = profiles.find(p => p._id === id);
        if (profile?.usersCount && profile.usersCount > 0) {
            alert(`Não é possível excluir: ${profile.usersCount} usuários vinculados.`);
            return;
        }
        if (!window.confirm('Deseja excluir este perfil?')) return;
        try {
            await permissionProfileService.delete(id);
            fetchProfiles();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const handleSave = async () => {
        if (!editingProfile?.name) return alert('Nome é obrigatório');
        try {
            if (editingProfile._id) {
                await permissionProfileService.update(editingProfile._id, editingProfile);
            } else {
                await permissionProfileService.create(editingProfile);
            }
            setShowModal(false);
            fetchProfiles();
        } catch (error: any) {
            alert('Erro ao salvar: ' + (error.response?.data?.message || error.message));
        }
    };

    const toggleModule = (slug: string) => {
        if (!editingProfile) return;
        const modules = editingProfile.modules || [];
        if (modules.includes(slug)) {
            setEditingProfile({
                ...editingProfile,
                modules: modules.filter(m => m !== slug)
            });
        } else {
            setEditingProfile({
                ...editingProfile,
                modules: [...modules, slug]
            });
        }
    };

    const togglePermission = (module: string, action: string) => {
        if (!editingProfile) return;
        const currentPerms = editingProfile.permissions || {};
        const modulePerms = currentPerms[module] || [];

        let nextPerms: string[];
        if (modulePerms.includes(action)) {
            nextPerms = modulePerms.filter(a => a !== action);
        } else {
            nextPerms = [...modulePerms, action];
        }

        setEditingProfile({
            ...editingProfile,
            permissions: { ...currentPerms, [module]: nextPerms }
        });
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <div className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={22} />
                        </div>
                        <h1 style={{ marginLeft: '12px' }}>Perfis de Permissão</h1>
                    </div>
                    <p>Configure perfis de acesso baseados em cargos e responsabilidades</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus size={20} /> Novo Perfil
                    </button>
                </div>
            </header>

            <div className="profiles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {loading ? (
                    <p>Carregando...</p>
                ) : profiles.map(profile => (
                    <div className="content-card profile-card" key={profile._id} style={{ padding: 0, overflow: 'hidden', borderTop: `4px solid ${profile.color}` }}>
                        <div className="profile-card-body" style={{ padding: '24px' }}>
                            <div className="profile-title-area" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div className="profile-name-info">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                        {React.createElement((LucideIcons as any)[profile.icon] || Shield, { size: 20, style: { color: profile.color } })}
                                        {profile.name}
                                    </h3>
                                    {profile.isSystem && (
                                        <span className="status-badge" style={{ background: 'var(--warning-soft)', color: 'var(--warning)', marginTop: '4px', fontSize: '10px' }}>
                                            SISTEMA
                                        </span>
                                    )}
                                </div>
                                <div className="profile-users">
                                    <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                                        {profile.usersCount || 0} usuários
                                    </span>
                                </div>
                            </div>
                            <p className="profile-desc" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px', minHeight: '40px' }}>
                                {profile.description || 'Perfil básico para acesso ao sistema.'}
                            </p>
                            <div className="profile-stats-chips" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <span className="chip" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                                    {ROLES.find(r => r.value === profile.defaultRole)?.label}
                                </span>
                                <span className="chip" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                                    {profile.modules.length} Módulos
                                </span>
                            </div>
                            <div className="profile-modules-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                {profile.modules.slice(0, 6).map(m => (
                                    <span key={m} className="status-badge" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', fontSize: '10px' }}>{m}</span>
                                ))}
                                {profile.modules.length > 6 && <span className="status-badge" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', fontSize: '10px' }}>+{profile.modules.length - 6}</span>}
                            </div>
                        </div>
                        <div className="profile-card-footer" style={{ padding: '12px 24px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="btn-icon sm" onClick={() => handleEdit(profile)} title="Editar">
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon sm" onClick={() => handleDelete(profile._id)} disabled={profile.isSystem} title="Excluir" style={{ color: 'var(--error)' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && editingProfile && (
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}>
                    <div className="modal-container" style={{ width: '900px', maxWidth: '95vw', background: 'var(--card-bg)', borderRadius: '24px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)' }}>
                                {editingProfile._id ? 'Editar Perfil' : 'Novo Perfil'}
                            </h2>
                            <button className="btn-icon sm" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="modal-body" style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nome do Perfil *</label>
                                    <input
                                        className="form-control"
                                        value={editingProfile.name}
                                        onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                                        placeholder="Ex: Supervisor de Produção"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role Padrão</label>
                                    <select
                                        className="form-control"
                                        value={editingProfile.defaultRole}
                                        onChange={e => setEditingProfile({ ...editingProfile, defaultRole: e.target.value })}
                                    >
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descrição</label>
                                    <textarea
                                        className="form-control"
                                        value={editingProfile.description}
                                        onChange={e => setEditingProfile({ ...editingProfile, description: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Identificação Visual</label>
                                    <div className="color-picker-group" style={{ display: 'flex', gap: '8px' }}>
                                        {colors.map(c => (
                                            <div
                                                key={c}
                                                className={`color-swatch ${editingProfile.color === c ? 'active' : ''}`}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: c,
                                                    cursor: 'pointer',
                                                    border: editingProfile.color === c ? '3px solid white' : 'none',
                                                    boxShadow: editingProfile.color === c ? `0 0 0 2px ${c}` : 'none'
                                                }}
                                                onClick={() => setEditingProfile({ ...editingProfile, color: c })}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ícone</label>
                                    <select
                                        className="form-control"
                                        value={editingProfile.icon}
                                        onChange={e => setEditingProfile({ ...editingProfile, icon: e.target.value })}
                                    >
                                        <option value="Shield">Escudo</option>
                                        <option value="Users">Usuários</option>
                                        <option value="Briefcase">Maleta</option>
                                        <option value="HardHat">Produção</option>
                                        <option value="Crown">Gestor</option>
                                        <option value="Monitor">TI</option>
                                        <option value="Activity">NOC</option>
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                Matriz de Permissões
                            </h3>
                            <div className="table-container">
                                <table className="ivory-table premium-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', width: '220px' }}>MÓDULO</th>
                                            {ALL_ACTIONS.map(action => (
                                                <th key={action.slug} className="text-center" style={{ fontSize: '10px' }}>{action.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_MODULES.map(module => {
                                            const isModuleActive = editingProfile.modules?.includes(module.slug);
                                            return (
                                                <tr key={module.slug} style={{ opacity: isModuleActive ? 1 : 0.6 }}>
                                                    <td className="perm-module-name">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isModuleActive}
                                                                onChange={() => toggleModule(module.slug)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                            />
                                                            <span style={{ fontWeight: 700 }}>{module.label}</span>
                                                        </div>
                                                    </td>
                                                    {ALL_ACTIONS.map(action => (
                                                        <td key={action.slug} className="text-center">
                                                            <input
                                                                type="checkbox"
                                                                disabled={!isModuleActive}
                                                                checked={editingProfile.permissions?.[module.slug]?.includes(action.slug)}
                                                                onChange={() => togglePermission(module.slug, action.slug)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--surface-1)' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSave}>
                                <Save size={18} /> Salvar Perfil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
