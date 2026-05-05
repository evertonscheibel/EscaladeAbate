import NonConformity from '../models/NonConformity.js';
import { paginate } from '../utils/paginationHelper.js';

/**
 * GET /api/non-conformities
 */
export const getNonConformities = async (req, res, next) => {
    try {
        const { area, status, criticality, programa } = req.query;
        const filter = {};

        if (area) filter.area = area;
        if (status) filter.status = status;
        if (criticality) filter.criticality = criticality;
        if (programa) filter.programa = programa;

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort || '-data_abertura',
            populate: [
                { path: 'area', select: 'nome' },
                { path: 'programa', select: 'nome' },
                { path: 'responsavel_acao', select: 'name' }
            ]
        };

        const result = await paginate(NonConformity, filter, options);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/non-conformities/:id
 */
export const getNonConformityById = async (req, res, next) => {
    try {
        const nc = await NonConformity.findById(req.params.id)
            .populate('origem_execucao', 'codigo_execucao')
            .populate('area', 'nome')
            .populate('programa', 'nome')
            .populate('responsavel_acao', 'name')
            .populate('historico_status.usuario', 'name');

        if (!nc) return res.status(404).json({ success: false, message: 'NC não encontrada' });
        res.json({ success: true, data: nc });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/non-conformities/:id (Atualizar CAPA)
 */
export const updateNonConformity = async (req, res, next) => {
    try {
        const nc = await NonConformity.findById(req.params.id);
        if (!nc) return res.status(404).json({ success: false, message: 'NC não encontrada' });

        const { status, comentario_historico, ...rest } = req.body;
        const statusAnterior = nc.status;

        // Se o status mudar, adicionar histórico (Fluxo 5)
        if (status && status !== statusAnterior) {
            nc.historico_status.push({
                status_anterior: statusAnterior,
                status_novo: status,
                usuario: req.user._id,
                comentario: comentario_historico || 'Mudança de status manual'
            });
            nc.status = status;

            if (status === 'Fechada') {
                nc.data_fechamento = new Date();
                nc.verificado_por = req.user._id;
            }
        }

        Object.assign(nc, rest);
        await nc.save();

        res.json({ success: true, data: nc });
    } catch (error) {
        next(error);
    }
};
