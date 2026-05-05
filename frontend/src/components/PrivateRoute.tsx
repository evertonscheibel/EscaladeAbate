import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
    children: React.ReactNode;
    roles?: string[];
    module?: string; // Slug do módulo (ex: 'pcp', 'quality')
    requireMaster?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles, module, requireMaster }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>Carregando...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Admins e Masters ignoram as travas de modulo/roles para evitar lockout
    const isSpecialUser = user.isMaster || user.role === 'admin';

    // 1. Verificar se a rota exige ser Master
    if (requireMaster && !user.isMaster) {
        return <Navigate to="/modules" replace />;
    }

    // 2. Verificar se o usuário tem o módulo liberado para ele (Pula para Admin/Master)
    if (module && !isSpecialUser) {
        // Mapeamento de Hierarquia: Se tem o PAI, tem acesso aos FILHOS
        const hierarchies: { [key: string]: string[] } = {
            'industria': ['pcp', 'desossa', 'slaughter', 'escala-abate', 'slaughter-closure'],
            'gep': ['candidates', 'gatehouse', 'job-positions'],
            'gestao-ti': ['tickets', 'assets', 'network', 'credentials', 'noc', 'knowledge-base', 'documents', 'reports', 'problems', 'maintenance', 'settings', 'users', 'permission-profiles']
        };

        const hasDirectAccess = user.allowedModules?.includes(module);
        
        // Verificar se tem acesso via PAI
        let hasParentAccess = false;
        for (const [parent, children] of Object.entries(hierarchies)) {
            if (children.includes(module) && user.allowedModules?.includes(parent)) {
                hasParentAccess = true;
                break;
            }
        }

        if (!hasDirectAccess && !hasParentAccess) {
            console.warn(`Acesso negado ao módulo ${module} para o usuário ${user.email}`);
            return <Navigate to="/modules" replace />;
        }

        // 3. Verificar se tem permissão granular de 'view' se houver permissões específicas
        if (user.permissions && user.permissions[module]) {
            const perms = user.permissions[module];
            if (!perms.includes('view')) {
                return <Navigate to="/modules" replace />;
            }
        }
    }

    // 4. Verificar Roles (Regras fixas do App - Pula para Admin/Master)
    if (roles && !roles.includes(user.role) && !isSpecialUser) {
        return <Navigate to="/modules" replace />;
    }

    return <>{children}</>;
};
