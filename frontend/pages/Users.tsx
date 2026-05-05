import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { Plus, Search, Edit, Trash2, User as UserIcon, RefreshCw, Laptop, Users as UsersIcon, Factory, UserPlus, Boxes } from 'lucide-react';
import '../pages/Tickets.css';
import { StandardFormModal } from '../components/StandardFormModal';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'tecnico' | 'cliente';
    active: boolean;
    isMaster?: boolean;
    allowedModules?: string[];
    createdAt: string;
}

export const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const defaultModules = [
        'dashboard', 'tickets', 'gestao-ti', 'gep', 'industria',
        'gestao-ativos', 'pcp', 'slaughter', 'slaughter-closure',
        'deboning', 'candidates', 'gatehouse', 'job-positions',
        'network', 'credentials', 'noc', 'knowledge-base', 'documents'
    ];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cliente' as 'admin' | 'tecnico' | 'cliente',
        active: true,
        isMaster: false,
        allowedModules: ['dashboard', 'tickets', 'knowledge-base', 'documents', 'gestao-ti']
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'cliente',
            active: true,
            isMaster: false,
            allowedModules: ['dashboard', 'tickets', 'knowledge-base', 'documents', 'gestao-ti']
        });
        setShowModal(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            active: user.active,
            isMaster: user.isMaster || false,
            allowedModules: user.allowedModules || ['dashboard', 'tickets', 'knowledge-base', 'documents']
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const dataToSend = { ...formData };
            if (!dataToSend.password) {
                delete (dataToSend as any).password;
            }

            if (selectedUser) {
                await userService.update(selectedUser._id, dataToSend);
            } else {
                await userService.create(dataToSend);
            }

            setShowModal(false);
            loadUsers();
            alert(selectedUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);

            let errorMessage = 'Erro ao salvar usuário. Verifique os dados e tente novamente.';

            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage = 'Permissão negada (403). Você não tem permissão de Administrador para criar/editar usuários.';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = `Erro: ${error.response.data.message}`;
                }
            }

            alert(errorMessage);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Deseja realmente deletar este usuário?')) return;

        try {
            await userService.delete(id);
            loadUsers();
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            alert('Erro ao deletar usuário.');
        }
    };

    const handleToggleActive = async (id: string, active: boolean) => {
        try {
            await userService.toggleActive(id);
            loadUsers();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status do usuário.');
        }
    };

    const handleSyncModules = async () => {
        if (!window.confirm('Isso aplicará as permissões padrão a TODOS os usuários do sistema baseando-se em suas funções (Admin, Técnico, Cliente). Deseja continuar?')) return;

        try {
            setLoading(true);
            const response = await userService.syncModules();
            alert((response as any).message || 'Sincronização concluída com sucesso!');
            loadUsers();
        } catch (error) {
            console.error('Erro ao sincronizar módulos:', error);
            alert('Erro ao sincronizar módulos.');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        const colors: any = {
            admin: '#ef4444',
            tecnico: '#3b82f6',
            cliente: '#10b981'
        };
        return colors[role] || '#64748b';
    };

    const getRoleLabel = (role: string) => {
        const labels: any = {
            admin: 'Administrador',
            tecnico: 'Técnico',
            cliente: 'Cliente'
        };
        return labels[role] || role;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Carregando usuários...</p>
            </div>
        );
    }

    const toggleModule = (moduleId: string) => {
        const currentModules = formData.allowedModules || [];
        const newModules = currentModules.includes(moduleId)
            ? currentModules.filter(id => id !== moduleId)
            : [...currentModules, moduleId];
        setFormData({ ...formData, allowedModules: newModules });
    };

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Gerenciamento de Usuários</h1>
                    <p>{filteredUsers.length} usuário(s) cadastrado(s)</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={handleSyncModules} title="Sincronizar permissões de todos os usuários">
                        <RefreshCw size={20} />
                        Sincronizar Todos
                    </button>
                    <button className="btn-primary" onClick={handleCreateUser}>
                        <Plus size={20} />
                        Novo Usuário
                    </button>
                </div>
            </div>

            <div className="tickets-toolbar">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="tickets-table-container">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Função</th>
                            <th>Status</th>
                            <th>Cadastrado em</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <UserIcon size={20} />
                                        </div>
                                        <strong>{user.name}</strong>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span
                                        className="priority-badge"
                                        style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                                    >
                                        {getRoleLabel(user.role)}
                                    </span>
                                    {user.isMaster && (
                                        <span
                                            style={{
                                                marginLeft: '8px',
                                                backgroundColor: '#7c3aed',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            MASTER
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={user.active}
                                            onChange={() => handleToggleActive(user._id, !user.active)}
                                            disabled={user._id === currentUser?.id}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                    <span style={{ marginLeft: '8px', fontSize: '14px', color: user.active ? '#10b981' : '#64748b' }}>
                                        {user.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEditUser(user)}
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {user._id !== currentUser?.id && (
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleDeleteUser(user._id)}
                                                title="Deletar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <StandardFormModal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title={selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
                    size="lg"
                    footer={
                        <div className="status-modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
                            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button type="submit" form="user-form" className="sfm-btn sfm-btn-primary">
                                {selectedUser ? 'Atualizar' : 'Criar Usuário'}
                            </button>
                        </div>
                    }
                >
                    <form id="user-form" onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group">
                            <label>Nome Completo *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Nome do usuário"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Senha {selectedUser && '(deixe em branco para não alterar)'}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!selectedUser}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>Função *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                required
                            >
                                <option value="cliente">Cliente</option>
                                <option value="tecnico">Técnico</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        {formData.role === 'admin' && (
                            <div className="form-group full-width" style={{ marginTop: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isMaster}
                                        onChange={(e) => setFormData({ ...formData, isMaster: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Usuário Master (Acesso total a métricas gerenciais)</span>
                                </label>
                            </div>
                        )}

                        <div className="form-group full-width" style={{ marginTop: '20px', padding: '20px', background: 'var(--surface, #f8fafc)', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)' }}>
                            <label style={{ marginBottom: '20px', display: 'block', fontWeight: 'bold', color: 'var(--primary, #667eea)', fontSize: '1.1rem', borderBottom: '2px solid rgba(102, 126, 234, 0.2)', paddingBottom: '10px' }}>
                                🔐 Permissões por Módulos
                            </label>

                            {/* Módulos Principais (Parent) */}
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Módulos Master</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                    {[
                                        { id: 'gestao-ti', label: 'Gestão TI', icon: Laptop, color: '#6366f1' },
                                        { id: 'gep', label: 'GEP (RH)', icon: UsersIcon, color: '#ec4899' },
                                        { id: 'industria', label: 'Indústria', icon: Factory, color: '#f59e0b' },
                                        { id: 'gestao-ativos', label: 'Ativos', icon: Boxes, color: '#10b981' }
                                    ].map((m) => (
                                        <label key={m.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: formData.allowedModules.includes(m.id) ? `${m.color}15` : '#fff',
                                            border: formData.allowedModules.includes(m.id) ? `2px solid ${m.color}` : '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input type="checkbox" checked={formData.allowedModules.includes(m.id)} onChange={() => toggleModule(m.id)} style={{ width: '18px', height: '18px' }} />
                                            <m.icon size={20} color={formData.allowedModules.includes(m.id) ? m.color : '#64748b'} />
                                            <span style={{ fontWeight: '600', fontSize: '14px', color: formData.allowedModules.includes(m.id) ? '#1e293b' : '#64748b' }}>{m.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                {/* Seção Indústria */}
                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f59e0b', fontSize: '14px' }}>
                                        <Factory size={18} /> PCP / Indústria
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {[
                                            { id: 'pcp', label: 'PCP Geral' },
                                            { id: 'slaughter', label: 'Prog. Abate' },
                                            { id: 'slaughter-closure', label: 'Fechamento SIF' },
                                            { id: 'deboning', label: 'Desossa' }
                                        ].map(sub => (
                                            <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={formData.allowedModules.includes(sub.id)} onChange={() => toggleModule(sub.id)} style={{ accentColor: '#f59e0b' }} />
                                                <span>{sub.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Seção GEP */}
                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#ec4899', fontSize: '14px' }}>
                                        <UserPlus size={18} /> GEP / RH
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {[
                                            { id: 'candidates', label: 'Recrutamento (ATS)' },
                                            { id: 'job-positions', label: 'Cargos e Vagas' },
                                            { id: 'gatehouse', label: 'Guaritas' }
                                        ].map(sub => (
                                            <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={formData.allowedModules.includes(sub.id)} onChange={() => toggleModule(sub.id)} style={{ accentColor: '#ec4899' }} />
                                                <span>{sub.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Seção Gestão TI */}
                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#6366f1', fontSize: '14px' }}>
                                        <Laptop size={18} /> Infra / Sistemas
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {[
                                            { id: 'dashboard', label: 'Dashboard IT' },
                                            { id: 'tickets', label: 'Chamados' },
                                            { id: 'assets', label: 'Ativos' },
                                            { id: 'documents', label: 'Documentos' },
                                            { id: 'knowledge-base', label: 'Base de Conhecimento' },
                                            { id: 'purchase-requests', label: 'Compras' },
                                            { id: 'metrics/my-performance', label: 'Área do Técnico' },
                                            { id: 'reports', label: 'Relatórios' },
                                            { id: 'network', label: 'Infra & Zabbix' },
                                            { id: 'credentials', label: 'Cofre Senhas' },
                                            { id: 'problems', label: 'Problemas' },
                                            { id: 'noc', label: 'NOC / Zabbix' }
                                        ].map(sub => (
                                            <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={formData.allowedModules.includes(sub.id)} onChange={() => toggleModule(sub.id)} style={{ accentColor: '#6366f1' }} />
                                                <span>{sub.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Status da Conta</label>
                            <select
                                value={formData.active ? 'true' : 'false'}
                                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                            >
                                <option value="true">Ativa</option>
                                <option value="false">Desativada</option>
                            </select>
                        </div>
                    </form>
                </StandardFormModal>
            )}

            <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #10b981;
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #1e293b;
          font-size: 14px;
        }

        .form-group input, 
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .priority-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 6px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }

        .btn-icon.danger:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
        }
      `}</style>
        </div>
    );
};

export default Users;
