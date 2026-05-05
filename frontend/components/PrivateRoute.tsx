import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
    children: React.ReactNode;
    roles?: string[];
    requireMaster?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles, requireMaster }) => {
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

    // Verificar se a rota exige ser Master
    if (requireMaster && !user.isMaster) {
        return <Navigate to="/dashboard" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        // Redirecionar técnicos para /tickets, outros para /dashboard
        const redirectTo = user.role === 'tecnico' ? '/tickets' : '/dashboard';
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
