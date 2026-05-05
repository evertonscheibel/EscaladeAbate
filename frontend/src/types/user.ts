export interface UserListItem {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    position?: string;
    phone?: string;
    employeeId?: string;
    active: boolean;
    permissionProfile?: {
        _id: string;
        name: string;
        color: string;
        icon: string;
    };
    hasCustomPermissions: boolean;
    lastLogin?: Date;
    createdAt: Date;
}

export interface UserDetail extends UserListItem {
    allowedModules: string[];
    permissions: Record<string, string[]>;
    avatar?: string;
    mustChangePassword: boolean;
    isMaster: boolean;
    supportLevel?: string;
    loginHistory?: Array<{
        at: string;
        ip: string;
        userAgent: string;
    }>;
    deactivatedAt?: Date;
    deactivatedBy?: { _id: string; name: string };
    deactivationReason?: string;
}

export interface EffectivePermissions {
    [module: string]: string[];
}

export interface PermissionProfile {
    _id: string;
    name: string;
    description?: string;
    color: string;
    icon: string;
    defaultRole: string;
    modules: string[];
    permissions: Record<string, string[]>;
    isSystem: boolean;
    active: boolean;
    usersCount?: number;
    createdBy?: { name: string };
    createdAt: Date;
}

export interface PermissionAuditEntry {
    _id: string;
    targetUserName: string;
    changedByName: string;
    action: string;
    before?: any;
    after?: any;
    details?: string;
    ip?: string;
    createdAt: Date;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    lockedUsers: number;
    byRole: Array<{ _id: string; count: number }>;
    byDepartment: Array<{ _id: string; count: number }>;
    recentLogins: Array<{ name: string; email: string; lastLogin: Date; role: string }>;
}

// Constantes
export const ALL_MODULES = [
    { slug: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { slug: 'tickets', label: 'Tickets / ITSM', icon: 'Ticket' },
    { slug: 'metrics/my-performance', label: 'Central do Atendente', icon: 'Activity' },
    { slug: 'knowledge-base', label: 'Base de Conhecimento', icon: 'BookOpen' },
    { slug: 'documents', label: 'Documentos', icon: 'FileText' },
    { slug: 'assets', label: 'Gestão de Ativos', icon: 'Monitor' },
    { slug: 'candidates', label: 'Candidatos / ATS', icon: 'Users' },
    { slug: 'job-positions', label: 'Vagas', icon: 'Briefcase' },
    { slug: 'gatehouse', label: 'Guaritas', icon: 'DoorOpen' },
    { slug: 'reports', label: 'Relatórios Gerenciais', icon: 'BarChart3' },
    { slug: 'metrics/manager', label: 'Indicadores (KPIs)', icon: 'LineChart' },
    { slug: 'network', label: 'Infraestrutura de Rede', icon: 'Network' },
    { slug: 'credentials', label: 'Cofre de Senhas', icon: 'Lock' },
    { slug: 'noc', label: 'NOC / Zabbix', icon: 'Activity' },
    { slug: 'problems', label: 'Problemas', icon: 'AlertTriangle' },
    { slug: 'maintenance', label: 'Manutenções', icon: 'Wrench' },
    { slug: 'purchase-requests', label: 'Compras', icon: 'ShoppingCart' },
    { slug: 'users', label: 'Gestão de Usuários', icon: 'UserCog' },
    { slug: 'permission-profiles', label: 'Perfis de Acesso', icon: 'Shield' },
    { slug: 'settings', label: 'Configurações', icon: 'Settings' },
    { slug: 'quality', label: 'Qualidade (PAC)', icon: 'ClipboardList' },
    { slug: 'quality/non-conformities', label: 'Não Conformidades', icon: 'ShieldAlert' },
    { slug: 'quality/audit-packages', label: 'Pacotes de Auditoria', icon: 'FileSpreadsheet' },
    { slug: 'quality/models', label: 'Modelos de Checklist', icon: 'FileSearch' },
    { slug: 'slaughter', label: 'Escala de Abate', icon: 'CalendarDays' },
    { slug: 'slaughter-closure', label: 'Fechamento SIF', icon: 'FileCheck' },
    { slug: 'desossa', label: 'Desossa', icon: 'Beef' },
    { slug: 'pcp', label: 'PCP', icon: 'LayoutGrid' }
];

export const ALL_ACTIONS = [
    { slug: 'view', label: 'Ver', icon: 'Eye' },
    { slug: 'create', label: 'Criar', icon: 'Plus' },
    { slug: 'edit', label: 'Editar', icon: 'Edit2' },
    { slug: 'close', label: 'Fechar', icon: 'Lock' },
    { slug: 'reopen', label: 'Reabrir', icon: 'Unlock' },
    { slug: 'delete', label: 'Excluir', icon: 'Trash2' },
    { slug: 'export', label: 'Exportar', icon: 'Download' },
    { slug: 'manage', label: 'Gerenciar', icon: 'Settings' }
];

export const DEPARTMENTS = [
    { value: 'PRODUCAO', label: 'Produção' },
    { value: 'ADMINISTRATIVO', label: 'Administrativo' },
    { value: 'MANUTENCAO', label: 'Manutenção' },
    { value: 'TI', label: 'TI' },
    { value: 'RH', label: 'Recursos Humanos' },
    { value: 'SEGURANCA', label: 'Segurança' },
    { value: 'QUALIDADE', label: 'Qualidade' },
    { value: 'LOGISTICA', label: 'Logística' },
    { value: 'COMERCIAL', label: 'Comercial' },
    { value: 'FINANCEIRO', label: 'Financeiro' },
    { value: 'COMPRAS', label: 'Compras' },
    { value: 'DIRETORIA', label: 'Diretoria' }
];

export const ROLES = [
    { value: 'admin', label: 'Administrador', color: '#9c27b0' },
    { value: 'tecnico', label: 'Técnico', color: '#667eea' },
    { value: 'cliente', label: 'Colaborador', color: '#4caf50' },
    { value: 'guarita_admin', label: 'Guarita Admin', color: '#f44336' },
    { value: 'guarita_supervisor', label: 'Guarita Supervisor', color: '#ff9800' },
    { value: 'guarita_operador', label: 'Guarita Operador', color: '#607d8b' }
];
