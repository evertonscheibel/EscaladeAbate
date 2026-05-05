import express from 'express';
import {
    getCredentials,
    getCredential,
    createCredential,
    updateCredential,
    deleteCredential,
    copyPassword,
    getCredentialStats,
    getAccessLog
} from '../controllers/credentialController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Middleware de auditoria e módulo para todas as mutações de credenciais
router.use(checkModule('credentials'));
router.use(auditMiddleware('CREDENTIAL'));

// Estatísticas (admin)
router.get('/stats', protect, authorize('admin'), getCredentialStats);

// Rotas de listagem e busca
router.get('/', protect, getCredentials);
router.get('/:id', protect, getCredential);
router.get('/:id/access-log', protect, getAccessLog);

// Rotas de criação e edição
router.post('/', protect, createCredential);
router.put('/:id', protect, updateCredential);
router.delete('/:id', protect, deleteCredential);

// Copiar senha (registra no log)
router.post('/:id/copy', protect, copyPassword);

export default router;
