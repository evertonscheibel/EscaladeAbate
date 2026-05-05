import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Users as UsersIcon, Laptop, LogOut, User, ExternalLink, CalendarDays } from 'lucide-react';
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

    const allModules: ModuleCard[] = [
        {
            id: 'gestao-ti',
            name: 'Gestão TI',
            description: 'Central de serviços e infraestrutura de TI',
            icon: <Monitor size={48} />,
            color: '#6366f1',
            features: ['Chamados', 'Base de Conhecimento', 'Rede & Infra', 'Cofre de Senhas', 'Relatórios']
        },
        {
            id: 'gep',
            name: 'GEP',
            description: 'Gestão Estratégica de Pessoas',
            icon: <UsersIcon size={48} />,
            color: '#10b981',
            features: ['Recrutamento (ATS)', 'Guaritas'],
            landingPage: '/candidates'
        },
        {
            id: 'escala-abate',
            name: 'Escala de Abate',
            description: 'Gestão e planejamento de abates',
            icon: <CalendarDays size={48} />,
            color: '#06b6d4',
            features: ['Programação de Abate', 'Controle de Produtores'],
            landingPage: '/slaughter'
        },
        {
            id: 'gestao-ativos',
            name: 'Gestão de Ativos',
            description: 'Controle de patrimônio e documentos',
            icon: <Laptop size={48} />,
            color: '#f59e0b',
            features: ['Ativos de TI', 'Documentos', 'Certificados', 'Manutenções'],
            externalUrl: 'http://10.1.1.142/login'
        }
    ];

    // Filtrar módulos baseado nas permissões do usuário
    const modules = allModules.filter(module => {
        // Apenas Master tem acesso total automático
        if (user?.isMaster) return true;

        // Verificar se o usuário tem permissão para este módulo
        const allowedModules = user?.allowedModules || [];
        return allowedModules.includes(module.id as string);
    });

    const handleSelectModule = (module: ModuleCard) => {
        if (module.externalUrl) {
            // Abrir URL externa em nova aba
            window.open(module.externalUrl, '_blank');
        } else {
            // Navegação interna
            setSelectedModule(module.id);
            navigate(module.landingPage || '/dashboard');
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
