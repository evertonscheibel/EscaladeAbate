import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    Laptop,
    FileText,
    BookOpen,
    DollarSign,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User as UserIcon,
    BarChart3,
    ShoppingCart,
    Activity,
    LineChart,
    Network,
    Lock,
    Shield,
    ShieldCheck,
    CalendarDays,
    Briefcase,
    LayoutGrid,
    Binary,
    Factory,
    Boxes,
    FileSpreadsheet,
    FileSearch,
    Truck,
    UserPlus,
    Grid3X3,
    ClipboardList
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useModule } from '../context/ModuleContext';
import './Sidebar.css';


interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { selectedModule, clearModule, moduleName } = useModule();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    interface MenuItem {
        path: string;
        icon: any;
        label: string;
        roles: string[];
        masterOnly?: boolean;
    }

    // Mapeamento de módulos para paths permitidos
    const moduleMenuMap: Record<string, string[]> = {
        'gestao-ti': [
            '/dashboard', '/tickets', '/metrics/my-performance', '/knowledge-base',
            '/network', '/credentials', '/reports', '/metrics/manager', '/users', '/permission-profiles', '/settings', '/problems', '/noc'
        ],
        'industria': [
            '/slaughter', '/slaughter-closure', '/slaughter-closure/:date',
            '/pcp', '/pcp/imports', '/pcp/external-lots', '/pcp/reports', '/pcp/day/:date',
            '/deboning', '/deboning/history', '/deboning/schedules/:date'
        ],
        'quality': [
            '/quality', '/quality/non-conformities', '/quality/audit-packages', '/quality/models', '/quality/settings', '/quality/scanner', '/quality/execute'
        ]
    };




    const menuGroups: { title: string; items: MenuItem[] }[] = [
        {
            title: 'Operação',
            items: [
                { path: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral', roles: ['admin', 'cliente', 'tecnico'] },
                { path: '/quality', icon: ClipboardList, label: 'Qualidade (PAC)', roles: ['admin', 'tecnico'] },
                { path: '/quality/non-conformities', icon: Shield, label: 'Não Conformidades', roles: ['admin', 'tecnico'] },
                { path: '/quality/audit-packages', icon: FileSpreadsheet, label: 'Pacotes de Auditoria', roles: ['admin', 'tecnico'] },
                { path: '/quality/models', icon: FileSearch, label: 'Modelos de Checklist', roles: ['admin', 'tecnico'] },
                { path: '/tickets', icon: Ticket, label: 'Chamados', roles: ['admin'] },
                { path: '/metrics/my-performance', icon: Activity, label: 'Central do Atendente', roles: ['admin', 'tecnico'] },
                { path: '/knowledge-base', icon: BookOpen, label: 'Base de Conhecimento', roles: ['admin', 'cliente'] },
                { path: '/assets', icon: Laptop, label: 'Ativos de TI', roles: ['admin', 'tecnico'] },
                { path: '/candidates', icon: UserPlus, label: 'Recrutamento (ATS)', roles: ['admin', 'tecnico'] },
                { path: '/job-positions', icon: Briefcase, label: 'Cargos e Vagas', roles: ['admin', 'tecnico'] },
                { path: '/gatehouse', icon: ShieldCheck, label: 'Guaritas', roles: ['admin', 'guarita_admin', 'guarita_supervisor', 'guarita_operador'] },

                { path: '/pcp', icon: LayoutGrid, label: 'PCP', roles: ['admin', 'tecnico'] },
                { path: '/slaughter', icon: CalendarDays, label: 'Programação de Abate', roles: ['admin', 'tecnico'] },
                { path: '/slaughter-closure', icon: FileSearch, label: 'Fechamento SIF', roles: ['admin', 'tecnico'] },





            ]
        },
        {
            title: 'Gestão',
            items: [
                { path: '/reports', icon: BarChart3, label: 'Relatórios', roles: ['admin'] },
                { path: '/metrics/manager', icon: LineChart, label: 'Indicadores (KPIs)', roles: ['admin'], masterOnly: true }
            ]
        },
        {
            title: 'Infraestrutura',
            items: [
                { path: '/network', icon: Network, label: 'Rede & Infraestrutura', roles: ['admin', 'tecnico'] },
                { path: 'http://10.1.1.235:3000/login', icon: Activity, label: 'NOC (Zabbix)', roles: ['admin', 'tecnico'] }
            ]
        },
        {
            title: 'Segurança',
            items: [
                { path: '/credentials', icon: Lock, label: 'Cofre de Senhas', roles: ['admin', 'tecnico'] },
                { path: '/documents', icon: FileText, label: 'Documentos', roles: ['admin', 'tecnico'] }
            ]
        },
    ];

    const adminItems: MenuItem[] = [
        { path: '/users', icon: Users, label: 'Usuários', roles: ['admin'] },
        { path: '/permission-profiles', icon: Shield, label: 'Perfis de Acesso', roles: ['admin'] },
        { path: '/settings', icon: Settings, label: 'Configurações do Sistema', roles: ['admin'] }
    ];

    // Obter paths permitidos para o módulo selecionado
    const allowedPaths = selectedModule ? moduleMenuMap[selectedModule] || [] : [];

    const filteredMenuGroups = menuGroups.map(group => {
        const filteredItems = group.items.filter(item => {
            const hasRole = item.roles.includes(user?.role || '');
            if (item.masterOnly && !user?.isMaster) return false;

            // Filtrar por módulo selecionado
            if (selectedModule && !allowedPaths.includes(item.path)) {
                return false;
            }

            // Extrair caminho base (ignorando query params)
            const cleanPath = item.path.split('?')[0];
            const moduleKey = cleanPath === '/dashboard' ? 'dashboard' : cleanPath.replace('/', '');

            // Tratamento especial para métricas
            const finalModuleKey = cleanPath.includes('metrics/') ? cleanPath.replace('/', '') : moduleKey;

            // Tratamento especial para documentos com tabs
            const isDocuments = cleanPath === '/documents';

            // Para admin master, sempre permitir metrics/manager se tiver role admin
            if (moduleKey === 'metrics/manager' && user?.isMaster && user?.role === 'admin') return true;

            // Se for master, tem acesso a tudo de suas roles
            if (user?.isMaster) return hasRole;

            // Se allowedModules for undefined (usuário legado) e não é master, permite se tiver a role
            if (!user?.allowedModules) return hasRole;

            const isIndustryItem = moduleMenuMap['industria']?.includes(item.path);
            const hasIndustryAccess = user?.allowedModules?.includes('industria') ||
                user?.allowedModules?.includes('pcp') ||
                user?.allowedModules?.includes('slaughter') ||
                user?.allowedModules?.includes('desossa');

            const isAllowed = user && (user.allowedModules || []).length > 0 &&
                (user.allowedModules!.includes(moduleKey) ||
                    user.allowedModules!.includes(finalModuleKey) ||
                    (isDocuments && user.allowedModules!.includes('documents')) ||
                    (isIndustryItem && hasIndustryAccess));

            return hasRole && isAllowed;

        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    const filteredAdminItems = adminItems.filter(item => {
        const hasRole = item.roles.includes(user?.role || '');
        if (item.masterOnly && !user?.isMaster) return false;

        const cleanPath = item.path.split('?')[0];
        const moduleKey = cleanPath.replace('/', '');

        if (user?.isMaster) return hasRole;
        if (!user?.allowedModules) return hasRole;

        return hasRole && user.allowedModules!.includes(moduleKey);
    });

    const handleSwitchModule = () => {
        clearModule();
        navigate('/modules');
    };


    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                {isOpen && (
                    <div className="sidebar-logo-container">
                        {/* Espaço para logo se necessário futuramente */}
                    </div>
                )}
                <button
                    className="toggle-btn"
                    onClick={toggleSidebar}
                    aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar" title={user?.name}>
                    <UserIcon size={24} color="white" />
                </div>
                {isOpen && (
                    <div className="user-info">
                        <p className="user-name">{user?.name}</p>
                        <span className="user-role">{user?.role}</span>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {filteredMenuGroups.map((group, index) => (
                    <div key={index} className="menu-group">
                        {isOpen && <h3 className="menu-group-title">{group.title}</h3>}
                        {group.items.map((item) => {
                            const isActive = location.pathname + location.search === item.path ||
                                (location.pathname === item.path && !item.path.includes('?'));
                            const isExternal = item.path.startsWith('http');
                            if (isExternal) {
                                return (
                                    <a
                                        key={item.path}
                                        href={item.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="nav-item"
                                    >
                                        <div className="nav-icon-container">
                                            <item.icon size={20} />
                                        </div>
                                        {isOpen && <span className="nav-text">{item.label}</span>}
                                    </a>
                                );
                            }
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <div className="nav-icon-container">
                                        <item.icon size={20} />
                                    </div>
                                    {isOpen && <span className="nav-text">{item.label}</span>}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                {selectedModule && (
                    <button onClick={handleSwitchModule} className="nav-item switch-module-btn">
                        <Grid3X3 size={20} />
                        {isOpen && <span>Trocar Módulo</span>}
                    </button>
                )}
                {filteredAdminItems.length > 0 && (
                    <div className={`settings-menu-container ${isSettingsOpen ? 'expanded' : ''}`}>
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`nav-item settings-toggle-btn ${isSettingsOpen ? 'active' : ''}`}
                        >
                            <Settings size={20} />
                            {isOpen && (
                                <>
                                    <span className="nav-text">CONFIGURAÇÕES</span>
                                    <ChevronRight
                                        size={16}
                                        className={`submenu-chevron ${isSettingsOpen ? 'rotated' : ''}`}
                                    />
                                </>
                            )}
                        </button>

                        {isSettingsOpen && (
                            <div className="settings-submenu">
                                {filteredAdminItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`nav-item submenu-item ${location.pathname === item.path ? 'active' : ''}`}
                                    >
                                        <div className="nav-icon-container">
                                            <item.icon size={18} />
                                        </div>
                                        {isOpen && <span className="nav-text">{item.label}</span>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <button onClick={logout} className="nav-item logout-btn">
                    <LogOut size={20} />
                    {isOpen && <span>Sair</span>}
                </button>
            </div>
        </div>
    );
};
