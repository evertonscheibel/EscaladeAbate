import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import { paginate } from '../utils/paginationHelper.js';

const router = express.Router();

/**
 * @desc    Listar logs de auditoria
 * @route   GET /api/audit
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { user, action, resource, severity } = req.query;
        let query = {};

        if (user) query.user = user;
        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (severity) query.severity = severity;

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: { createdAt: -1 },
            populate: [{ path: 'user', select: 'name email role' }]
        };

        const result = await paginate(AuditLog, query, options);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Obter detalhes de um log
 * @route   GET /api/audit/:id
 * @access  Private (Admin)
 */
router.get('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const log = await AuditLog.findById(req.params.id)
            .populate('user', 'name email role');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log não encontrado'
            });
        }

        res.json({
            success: true,
            data: log
        });
    } catch (error) {
        next(error);
    }
});

export default router;
