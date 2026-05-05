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
        <div className="perm-profiles-container">
            <header className="perm-profiles-header">
                <h1><Shield size={32} /> Perfis de Permissão</h1>
                <button className="btn-new-user" onClick={handleCreate}>
                    <Plus size={20} /> Novo Perfil
                </button>
            </header>

            <div className="profiles-grid">
                {loading ? (
                    <p>Carregando...</p>
                ) : profiles.map(profile => (
                    <div className="profile-card" key={profile._id}>
                        <div className="profile-card-top" style={{ background: profile.color }}></div>
                        <div className="profile-card-body">
                            <div className="profile-title-area">
                                <div className="profile-name-info">
                                    <h3>
                                        {React.createElement((LucideIcons as any)[profile.icon] || Shield, { size: 20, color: profile.color })}
                                        {profile.name}
                                    </h3>
                                    {profile.isSystem && <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.6rem', marginTop: '4px' }}>SISTEMA</span>}
                                </div>
                                <div className="profile-users">
                                    <span className="badge" style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>
                                        {profile.usersCount || 0} usuários
                                    </span>
                                </div>
                            </div>
                            <p className="profile-desc">{profile.description || 'Sem descrição.'}</p>
                            <div className="profile-stats-chips">
                                <span className="chip" style={{ background: `${profile.color}10`, color: profile.color }}>
                                    Role: {ROLES.find(r => r.value === profile.defaultRole)?.label}
                                </span>
                                <span className="chip">
                                    {profile.modules.length} Módulos
                                </span>
                            </div>
                            <div className="profile-modules-preview">
                                {profile.modules.slice(0, 6).map(m => (
                                    <span key={m} className="module-tag">{m}</span>
                                ))}
                                {profile.modules.length > 6 && <span className="module-tag">+{profile.modules.length - 6}</span>}
                            </div>
                        </div>
                        <div className="profile-card-footer">
                            <button className="action-btn" onClick={() => handleEdit(profile)} title="Editar">
                                <Edit2 size={16} />
                            </button>
                            <button className="action-btn" onClick={() => handleDelete(profile._id)} disabled={profile.isSystem} title="Excluir">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && editingProfile && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>{editingProfile._id ? 'Editar Perfil' : 'Novo Perfil'}</h2>
                            <button className="action-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="form-grid" style={{ marginBottom: '32px' }}>
                            <div className="form-group">
                                <label>Nome do Perfil *</label>
                                <input
                                    value={editingProfile.name}
                                    onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                                    placeholder="Ex: Supervisor de Produção"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role Padrão</label>
                                <select
                                    value={editingProfile.defaultRole}
                                    onChange={e => setEditingProfile({ ...editingProfile, defaultRole: e.target.value })}
                                >
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Descrição</label>
                                <textarea
                                    value={editingProfile.description}
                                    onChange={e => setEditingProfile({ ...editingProfile, description: e.target.value })}
                                    rows={2}
                                />
                            </div>
                            <div className="form-group">
                                <label>Identificação Visual</label>
                                <div className="color-picker-group">
                                    {colors.map(c => (
                                        <div
                                            key={c}
                                            className={`color-swatch ${editingProfile.color === c ? 'active' : ''}`}
                                            style={{ background: c }}
                                            onClick={() => setEditingProfile({ ...editingProfile, color: c })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ícone</label>
                                <select
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

                        <h3>Permissões do Perfil</h3>
                        <div className="perm-table-container">
                            <table className="perm-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', width: '200px' }}>Módulo</th>
                                        {ALL_ACTIONS.map(action => <th key={action.slug}>{action.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ALL_MODULES.map(module => {
                                        const isModuleActive = editingProfile.modules?.includes(module.slug);
                                        return (
                                            <tr key={module.slug}>
                                                <td className="perm-module-name">
                                                    <input
                                                        type="checkbox"
                                                        checked={isModuleActive}
                                                        onChange={() => toggleModule(module.slug)}
                                                    />
                                                    {module.label}
                                                </td>
                                                {ALL_ACTIONS.map(action => (
                                                    <td key={action.slug} className="perm-cell">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!isModuleActive}
                                                            checked={editingProfile.permissions?.[module.slug]?.includes(action.slug)}
                                                            onChange={() => togglePermission(module.slug, action.slug)}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                            <button className="btn-back" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn-save-section" style={{ marginTop: 0 }} onClick={handleSave}>
                                <Save size={18} /> Salvar Perfil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
