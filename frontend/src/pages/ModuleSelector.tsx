import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Users as UsersIcon, Laptop, LogOut, User, ExternalLink, CalendarDays, Activity, LayoutGrid, Factory, ClipboardList } from 'lucide-react';
import { useModule, ModuleType } from '../context/ModuleContext';
import { useAuth } from '../context/AuthContext';
import './ModuleSelector.css';

interface ModuleCard {
    id: ModuleType;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    features: string[];
    externalUrl?: string; // URL externa opcional
    landingPage?: string; // Página inicial interna personalizada
}

export const ModuleSelector: React.FC = () => {
    const navigate = useNavigate();
    const { setSelectedModule } = useModule();
    const { user, logout } = useAuth();
    const allowedModules = user?.allowedModules || [];

    const allModules: ModuleCard[] = [
        {
            id: 'industria',
            name: 'Indústria',
            description: 'Gestão da Planta Industrial',
            icon: <Factory size={48} />,
            color: '#8b5cf6',
            features: ['Escala de Abate', 'Fechamento SIF'],
            landingPage: '/slaughter'
        }
    ];


    // Filtrar módulos baseado nas permissões do usuário
    const modules = allModules.filter(module => {
        // Apenas Master tem acesso total automático
        if (user?.isMaster) return true;

        const isAllowedByModule = module.id === 'industria'
            ? (allowedModules.includes('industria') || allowedModules.includes('pcp') || allowedModules.includes('slaughter') || allowedModules.includes('desossa') || allowedModules.includes('escala-abate'))
            : (module.id === 'gestao-ti'
                ? (allowedModules.includes('gestao-ti') || allowedModules.includes('tickets') || allowedModules.includes('dashboard') || allowedModules.includes('network') || allowedModules.includes('credentials'))
                : (module.id === 'gep'
                    ? (allowedModules.includes('gep') || allowedModules.includes('candidates') || allowedModules.includes('gatehouse'))
                    : allowedModules.includes(module.id as string)));

        if (!isAllowedByModule) return false;

        // Se chegamos aqui, tem o módulo. Verificamos granularidade 'view' se houver permissões.
        if (user?.permissions) {
            const moduleKey = module.id as string;
            const perms = user.permissions[moduleKey];

            // Fallback para sub-módulos de indústria
            let effectivePerms = perms;
            if (!effectivePerms && module.id === 'industria') {
                effectivePerms = user.permissions['industria'] ||
                    user.permissions['pcp'] ||
                    user.permissions['slaughter'] ||
                    user.permissions['escala-abate'] ||
                    user.permissions['desossa'];
            }
            if (!effectivePerms && module.id === 'quality') {
                effectivePerms = user.permissions['quality'] || user.permissions['industria'];
            }

            if (effectivePerms && !effectivePerms.includes('view')) {
                return false;
            }
        }

        return true;
    });

    const handleSelectModule = (module: ModuleCard) => {
        if (module.externalUrl) {
            // Abrir URL externa em nova aba
            window.open(module.externalUrl, '_blank');
        } else {
            // Navegação interna
            setSelectedModule(module.id);
            
            // Lógica inteligente de Landing Page baseada em permissão
            let targetPath = module.landingPage || '/dashboard';
            
            if (module.id === 'industria' && !user?.isMaster) {
                if (allowedModules.includes('industria') || allowedModules.includes('slaughter') || allowedModules.includes('escala-abate')) {
                    targetPath = '/slaughter';
                } else if (allowedModules.includes('slaughter-closure')) {
                    targetPath = '/slaughter-closure';
                }
            } else if (module.id === 'gep' && !user?.isMaster) {
                if (allowedModules.includes('gep') || allowedModules.includes('candidates')) {
                    targetPath = '/gep/candidates';
                } else if (allowedModules.includes('job-positions')) {
                    targetPath = '/gep/positions';
                } else if (allowedModules.includes('gatehouse')) {
                    targetPath = '/gatehouse';
                }
            }

            navigate(targetPath);
        }
    };

    return (
        <div className="module-selector">
            <div className="module-selector-header">
                <div className="user-welcome">
                    <div className="user-avatar">
                        <User size={24} />
                    </div>
                    <div className="user-info">
                        <span className="welcome-text">Bem-vindo(a),</span>
                        <span className="user-name">{user?.name}</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={logout}>
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>

            <div className="module-selector-content">
                <h1 className="module-selector-title">Selecione um Módulo</h1>
                <p className="module-selector-subtitle">Escolha qual área do sistema você deseja acessar</p>

                {modules.length === 0 ? (
                    <div className="no-modules-message">
                        <p>Você não tem acesso a nenhum módulo.</p>
                        <p>Entre em contato com o administrador do sistema.</p>
                    </div>
                ) : (
                    <div className="modules-grid">
                        {modules.map((module) => (
                            <div
                                key={module.id}
                                className="module-card"
                                style={{ '--module-color': module.color } as React.CSSProperties}
                                onClick={() => handleSelectModule(module)}
                            >
                                <div className="module-card-icon">
                                    {module.icon}
                                </div>
                                <h2 className="module-card-title">
                                    {module.name}
                                    {module.externalUrl && <ExternalLink size={16} style={{ marginLeft: 8, opacity: 0.7 }} />}
                                </h2>
                                <p className="module-card-description">{module.description}</p>
                                <ul className="module-card-features">
                                    {module.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                    ))}
                                </ul>
                                <button className="module-card-btn">
                                    {module.externalUrl ? 'Acessar Sistema Externo' : 'Acessar'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <footer className="module-selector-footer">
                <p>GestãoPro © 2026 - Todos os direitos reservados</p>
            </footer>
        </div>
    );
};
