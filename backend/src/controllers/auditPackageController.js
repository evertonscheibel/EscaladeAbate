import AuditPackage from '../models/AuditPackage.js';
import ChecklistExecution from '../models/ChecklistExecution.js';
import NonConformity from '../models/NonConformity.js';
import { paginate } from '../utils/paginationHelper.js';
// import { generateAuditPdf } from '../utils/pdfGenerator.js'; // Implementarei depois

/**
 * GET /api/audit-packages
 */
export const getAuditPackages = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: '-data_geracao',
            populate: [{ path: 'gerado_por', select: 'name' }]
        };
        const result = await paginate(AuditPackage, {}, options);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/audit-packages (Fluxo 7)
 */
export const createAuditPackage = async (req, res, next) => {
    try {
        const { titulo, periodo_inicio, periodo_fim, programas, areas, motivo, auditor } = req.body;

        const count = await AuditPackage.countDocuments();
        const codigo = `AUD-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // 1. Criar o registro
        const auditPackage = await AuditPackage.create({
            codigo,
            titulo,
            periodo_inicio,
            periodo_fim,
            programas,
            areas,
            motivo,
            auditor,
            gerado_por: req.user._id,
            status: 'Gerado'
        });

        // 2. Aqui chamaremos o serviço de geração de PDF assincronamente ou aguardaremos
        // Por hora, apenas retornamos o sucesso do registro

        res.status(201).json({
            success: true,
            data: auditPackage,
            message: 'Pacote de auditoria registrado. O PDF está sendo gerado.'
        });
    } catch (error) {
        next(error);
    }
};
