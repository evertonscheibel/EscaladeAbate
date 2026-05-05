import express from 'express';
import {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    cancelPurchaseOrder,
    receiveItems,
    getOrderStats
} from '../controllers/purchaseOrderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas de estatísticas
router.get('/stats', protect, getOrderStats);

// Rotas principais
router.route('/')
    .get(protect, getPurchaseOrders)
    .post(protect, authorize('admin', 'tecnico'), createPurchaseOrder);

// Ações específicas
router.post('/:id/cancel', protect, authorize('admin'), cancelPurchaseOrder);
router.post('/:id/receive', protect, authorize('admin', 'tecnico'), receiveItems);

// CRUD por ID
router.route('/:id')
    .get(protect, getPurchaseOrder)
    .put(protect, authorize('admin', 'tecnico'), updatePurchaseOrder);

export default router;
