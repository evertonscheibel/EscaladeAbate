import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    BookOpen,
    BarChart3,
    LineChart,
    Network,
    Lock,
    FileText,
    Laptop,
    Activity,
    Users,
    Shield,
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    User as UserIcon,
    Grid3X3,
    Zap,
    Gauge,
    AlertTriangle,
    Snowflake,
    Briefcase
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useModule } from '../context/ModuleContext';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    onNavigate?: () => void;
}

interface MenuItem {
    path: string;
    icon: React.ElementType;
    label: string;
    roles: string[];
    module: string; // Add module association
    masterOnly?: boolean;
    external?: boolean;
}

interface MenuGroup {
    id: string;
    title: string;
    color: string;
    items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
    {
        id: 'operacao',
        title: 'Abate',
        color: '#ef4444',
        items: [
            { path: '/slaughter', icon: Activity, label: 'Escala de Abate', roles: ['admin', 'tecnico'], module: 'industria' },
            { path: '/slaughter-closure', icon: FileText, label: 'Fechamento SIF', roles: ['admin', 'tecnico'], module: 'industria' },
        ],
    },
];

const adminItems: MenuItem[] = [
    { path: '/users', icon: Users, label: 'Usuários', roles: ['admin'], module: 'industria' },
    { path: '/settings', icon: Settings, label: 'Configurações', roles: ['admin'], module: 'industria' },
];

const Tooltip: React.FC<{ label: string }> = ({ label }) => (
    <div className="sidebar-tooltip">
        <div className="sidebar-tooltip-arrow" />
        {label}
    </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, onNavigate }) => {
    const { user, logout } = useAuth();
    const { selectedModule, clearModule } = useModule();
    const location = useLocation();
    const navigate = useNavigate();

    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [hoveredFooter, setHoveredFooter] = useState<string | null>(null);

    const toggleGroup = (id: string) => {
        setCollapsedGroups(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const handleSwitchModule = () => {
        clearModule();
        navigate('/modules');
    };

    const isPathActive = (path: string) =>
        location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    const filterItems = (items: MenuItem[]) =>
        items.filter(item => {
            if (!user) return false;
            
            // 1. Filtragem por Módulo Selecionado (SUPERIOR)
            if (selectedModule && item.module !== selectedModule) {
                // Exceção: permitir NOC ver itens de infraestrutura se desejar? Não, manter estrito.
                return false;
            }

            // 2. Roles e Master
            if (user.role === 'admin') return true;
            if (item.masterOnly && !user.isMaster) return false;
            if (item.roles && item.roles.length > 0 && !item.roles.includes(user.role)) return false;

            // 3. Allowed Modules (Permissões de nível granulado no usuário)
            let moduleKey = item.path.replace(/^\//, '').split(/[/?]/)[0];
            
            // Mapeamento de Slugs legados/frontend para Backend
            const slugMapping: { [key: string]: string } = {
                'slaughter-closure': 'escala-abate',
                'deboning': 'desossa',
                'gatehouse': 'gep'
            };
            
            if (slugMapping[moduleKey]) {
                moduleKey = slugMapping[moduleKey];
            }

            if (user.allowedModules && user.allowedModules.length > 0) {
                const hierarchies: { [key: string]: string[] } = {
                    'industria': ['pcp', 'desossa', 'slaughter', 'escala-abate', 'slaughter-closure'],
                    'gep': ['candidates', 'gatehouse', 'job-positions'],
                    'gestao-ti': ['tickets', 'assets', 'network', 'credentials', 'noc', 'knowledge-base', 'documents', 'reports', 'problems', 'maintenance', 'settings', 'users', 'permission-profiles']
                };

                const hasDirectAccess = user.allowedModules.includes(moduleKey);
                let hasParentAccess = false;
                for (const [parent, children] of Object.entries(hierarchies)) {
                    if (children.includes(moduleKey) && user.allowedModules.includes(parent)) {
                        hasParentAccess = true;
                        break;
                    }
                }

                if (!hasDirectAccess && !hasParentAccess && moduleKey !== '' && !user.allowedModules.includes('dashboard')) {
                    return false;
                }
            }

            // 4. Permissões específicas (View)
            if (user.permissions && user.permissions[moduleKey]) {
                const perms = user.permissions[moduleKey];
                if (!perms.includes('view')) return false;
            }

            return true;
        });

    const visibleGroups = menuGroups
        .map(group => ({ ...group, items: filterItems(group.items) }))
        .filter(group => group.items.length > 0);

    const visibleAdminItems = filterItems(adminItems);

    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-bg-glow" />

            {/* ── HEADER ── */}
            <div className="sidebar-header">
                {isOpen && (
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <Zap size={14} color="white" />
                        </div>
                        <div className="sidebar-brand-text">
                            <span className="sidebar-brand-name">Indústria</span>
                            <span className="sidebar-brand-module">Gestão Industrial</span>
                        </div>
                    </div>
                )}
                <button
                    className="toggle-btn"
                    onClick={toggleSidebar}
                    aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
                >
                    {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>

            {/* ── USER ── */}
            <div className="sidebar-user">
                <div className="user-avatar-premium-sidebar" title={user?.name}>
                    <UserIcon size={18} color="white" />
                </div>
                {isOpen && (
                    <div className="user-info">
                        <p className="user-name">{user?.name}</p>
                        <div className="user-status">
                            <span className="user-status-dot" />
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── NAV ── */}
            <nav className="sidebar-nav">
                {visibleGroups.map((group) => {
                    const isCollapsed = collapsedGroups.includes(group.id);
                    const groupHasActive = group.items.some(i => isPathActive(i.path));

                    return (
                        <div key={group.id} className="menu-group">
                            {/* Group header — só quando aberto */}
                            {isOpen ? (
                                <button
                                    className="menu-group-header"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <span
                                        className="menu-group-dot"
                                        style={{
                                            background: group.color,
                                            boxShadow: groupHasActive ? `0 0 8px ${group.color}` : 'none',
                                        }}
                                    />
                                    <span
                                        className="menu-group-title"
                                        style={{ color: groupHasActive ? group.color : undefined }}
                                    >
                                        {group.title}
                                    </span>
                                    <ChevronDown
                                        size={13}
                                        className={`group-chevron ${isCollapsed ? 'collapsed' : ''}`}
                                    />
                                </button>
                            ) : (
                                <div
                                    className="menu-group-divider"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${group.color}55, transparent)`,
                                    }}
                                />
                            )}

                            {/* Items */}
                            <div
                                className={`menu-group-items${isCollapsed && isOpen ? ' items-collapsed' : ''}`}
                                style={!isOpen ? { padding: '0 6px' } : undefined}
                            >
                                {group.items.map((item) => {
                                    const active = isPathActive(item.path);

                                    const innerContent = (
                                        <>
                                            {active && (
                                                <span
                                                    className="nav-active-bar"
                                                    style={{
                                                        background: group.color,
                                                        boxShadow: `2px 0 10px ${group.color}66`,
                                                    }}
                                                />
                                            )}
                                            <div
                                                className="nav-icon-container"
                                                style={{
                                                    color: active ? group.color : undefined,
                                                    filter: active ? `drop-shadow(0 0 5px ${group.color}88)` : undefined,
                                                }}
                                            >
                                                <item.icon size={18} />
                                            </div>
                                            {isOpen && (
                                                <>
                                                    <span className="nav-text">{item.label}</span>
                                                    {item.external && (
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="nav-external-icon">
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                            <polyline points="15 3 21 3 21 9" />
                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                        </svg>
                                                    )}
                                                </>
                                            )}
                                            {!isOpen && <Tooltip label={item.label} />}
                                        </>
                                    );

                                    const cls = `nav-item${active ? ' active' : ''}`;
                                    const style: React.CSSProperties = active
                                        ? {
                                            background: `linear-gradient(135deg, ${group.color}1A, ${group.color}0D)`,
                                            color: group.color,
                                            boxShadow: `inset 0 0 0 1px ${group.color}2A`,
                                            fontWeight: 700,
                                        }
                                        : {};

                                    if (item.external) {
                                        return (
                                            <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer"
                                                className={cls} style={style} onClick={onNavigate}>
                                                {innerContent}
                                            </a>
                                        );
                                    }
                                    return (
                                        <Link key={item.path} to={item.path}
                                            className={cls} style={style} onClick={onNavigate}>
                                            {innerContent}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* ── FOOTER ── */}
            <div className="sidebar-footer">

                {/* Configurações / Administração */}
                {visibleAdminItems.length > 0 && (
                    <div className="settings-menu-container">
                        <button
                            className={`nav-item settings-toggle-btn${settingsOpen ? ' settings-open' : ''}`}
                            onClick={() => setSettingsOpen(!settingsOpen)}
                        >
                            <div className="nav-icon-container">
                                <Settings size={18} />
                            </div>
                            {isOpen ? (
                                <>
                                    <span className="nav-text nav-text-admin">Administração</span>
                                    <ChevronDown
                                        size={13}
                                        className={`group-chevron${settingsOpen ? '' : ' collapsed'}`}
                                    />
                                </>
                            ) : (
                                hoveredFooter === 'admin' && <Tooltip label="Administração" />
                            )}
                        </button>

                        {settingsOpen && isOpen && (
                            <div className="settings-submenu">
                                {visibleAdminItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`nav-item submenu-item${location.pathname.startsWith(item.path) ? ' active submenu-active' : ''}`}
                                        onClick={onNavigate}
                                    >
                                        <div className="nav-icon-container">
                                            <item.icon size={16} />
                                        </div>
                                        <span className="nav-text">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Trocar Módulo */}
                {selectedModule && (
                    <div
                        className="footer-item-wrapper"
                        onMouseEnter={() => setHoveredFooter('switch')}
                        onMouseLeave={() => setHoveredFooter(null)}
                    >
                        <button onClick={handleSwitchModule} className="nav-item switch-module-btn">
                            <div className="nav-icon-container">
                                <Grid3X3 size={18} />
                            </div>
                            {isOpen
                                ? <span className="nav-text">Trocar Módulo</span>
                                : hoveredFooter === 'switch' && <Tooltip label="Trocar Módulo" />
                            }
                        </button>
                    </div>
                )}

                {/* Sair */}
                <div
                    className="footer-item-wrapper"
                    onMouseEnter={() => setHoveredFooter('logout')}
                    onMouseLeave={() => setHoveredFooter(null)}
                >
                    <button onClick={logout} className="nav-item logout-btn">
                        <div className="nav-icon-container">
                            <LogOut size={18} />
                        </div>
                        {isOpen
                            ? <span className="nav-text">Sair</span>
                            : hoveredFooter === 'logout' && <Tooltip label="Sair" />
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};
