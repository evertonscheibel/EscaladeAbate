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
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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
