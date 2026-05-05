import express from 'express';
import {
    getPurchaseRequests,
    getPurchaseRequest,
    createPurchaseRequest,
    updatePurchaseRequest,
    deletePurchaseRequest,
    submitForQuotation,
    addApproval,
    cancelRequest,
    getRequestStats,
    createAssetFromRequest
} from '../controllers/purchaseRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas de estatísticas (antes das rotas com :id)
router.get('/stats', protect, getRequestStats);

// Rotas principais
router.route('/')
    .get(protect, getPurchaseRequests)
    .post(protect, createPurchaseRequest);

// Rotas com ações específicas
router.post('/:id/submit', protect, submitForQuotation);
router.post('/:id/approve', protect, authorize('admin', 'gestor'), addApproval);
router.post('/:id/cancel', protect, cancelRequest);
router.post('/:id/create-asset', protect, authorize('admin'), createAssetFromRequest);

// Rotas de CRUD por ID
router.route('/:id')
    .get(protect, getPurchaseRequest)
    .put(protect, updatePurchaseRequest)
    .delete(protect, deletePurchaseRequest);

export default router;
