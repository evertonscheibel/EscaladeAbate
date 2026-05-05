import AuditLog from '../models/AuditLog.js';

/**
 * Função utilitária para registrar log de auditoria manualmente.
 */
export const logAudit = async ({
    user,
    action,
    resource,
    resourceId,
    oldData,
    newData,
    severity = 'low',
    status = 'success',
    details,
    req
}) => {
    try {
        await AuditLog.create({
            user: user?._id || user,
            action,
            resource,
            resourceId,
            oldData,
            newData,
            severity,
            status,
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get ? req.get('User-Agent') : undefined
        });
    } catch (error) {
        console.error('CRITICAL: Erro ao registrar log de auditoria:', error);
    }
};

/**
 * Middleware para capturar automaticamente mutações (POST, PUT, DELETE).
 * Deve ser usado nas rotas que exigem auditoria.
 */
export const auditMiddleware = (resourceName) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        const method = req.method;

        // Apenas auditar mutações
        if (!['POST', 'PUT', 'DELETE'].includes(method)) {
            return next();
        }

        // Criar um hook no res.json para saber quando a requisição terminou
        res.json = function (data) {
            res.json = originalJson; // restaura

            // Não audita se for erro 4xx ou 5xx (a menos que seja falha de segurança específica)
            const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

            // Determinar ação
            let action = 'UNKNOWN';
            if (method === 'POST') action = 'CREATE';
            else if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
            else if (method === 'DELETE') action = 'DELETE';

            // Logs em segundo plano para não travar a resposta
            if (req.user) {
                logAudit({
                    user: req.user,
                    action,
                    resource: resourceName,
                    resourceId: req.params.id || data?.data?._id || data?._id,
                    newData: method !== 'DELETE' ? req.body : undefined,
                    status: isSuccess ? 'success' : 'failure',
                    severity: method === 'DELETE' ? 'high' : 'low',
                    req
                });
            }

            return res.json(data);
        };

        next();
    };
};
