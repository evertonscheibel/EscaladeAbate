import express from 'express';
import {
    getUsers, getUserById, createUser, updateUser,
    updateUserPermissions, deactivateUser, reactivateUser,
    resetPasswordByAdmin, getUserAuditLog, getUserStats
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(auditMiddleware('USER'));

// Stats (acima das rotas com :id para não conflitar)
router.get('/stats', authorize('admin'), getUserStats);

// CRUD
router.route('/')
    .get(authorize('admin', 'tecnico'), getUsers)
    .post(authorize('admin'), createUser);

router.route('/:id')
    .get(authorize('admin', 'tecnico'), getUserById)
    .put(authorize('admin'), updateUser);

// Permissões
router.put('/:id/permissions', authorize('admin'), updateUserPermissions);

// Ações
router.put('/:id/deactivate', authorize('admin'), deactivateUser);
router.put('/:id/reactivate', authorize('admin'), reactivateUser);
router.post('/:id/reset-password', authorize('admin'), resetPasswordByAdmin);

// Auditoria
router.get('/:id/audit-log', authorize('admin'), getUserAuditLog);

export default router;
