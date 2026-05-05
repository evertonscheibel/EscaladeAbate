import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Não autorizado - Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        if (!req.user.active) {
            return res.status(401).json({
                success: false,
                message: 'Usuário inativo'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acesso negado. Função ${req.user.role} não autorizada`
            });
        }
        next();
    };
};

export const checkModule = (moduleSlug) => {
    return (req, res, next) => {
        // Master users and admins always have access
        if (req.user.isMaster || req.user.role === 'admin') {
            return next();
        }

        // Se o usuário não tem a lista de módulos (usuário legado)
        // Permitir se for técnico (fallback básico)
        if (!req.user.allowedModules && req.user.role === 'tecnico') {
            return next();
        }

        // Se o módulo não está na lista permitida
        if (!req.user.allowedModules || !req.user.allowedModules.includes(moduleSlug)) {
            return res.status(403).json({
                success: false,
                message: `Acesso negado ao módulo: ${moduleSlug}`
            });
        }
        next();
    };
};
