import express from 'express';
import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    syncUserModules
} from '../controllers/userController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação e a permissão específica de 'users'
router.use(protect);
router.use(checkModule('users'));
router.use(authorize('admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

router.patch('/:id/toggle-active', toggleUserActive);
router.post('/sync-modules', syncUserModules);

export default router;
