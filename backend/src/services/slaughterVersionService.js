import SlaughterVersion from '../models/SlaughterVersion.js';

export const createSlaughterSnapshot = async ({ resourceId, resourceType, data, user, changeReason, req }) => {
    try {
        // Obter a última versão
        const lastVersion = await SlaughterVersion.findOne({ resourceId, resourceType })
            .sort({ version: -1 });

        const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

        await SlaughterVersion.create({
            resourceId,
            resourceType,
            version: nextVersion,
            data,
            changedBy: user?._id || user,
            changeReason,
            metadata: {
                ip: req?.ip,
                userAgent: req?.headers?.['user-agent']
            }
        });
    } catch (error) {
        console.error('Erro ao criar snapshot de abate:', error);
        // Não lançamos o erro para não travar a operação principal, 
        // mas em um ambiente de missão crítica poderíamos tratar diferente.
    }
};
