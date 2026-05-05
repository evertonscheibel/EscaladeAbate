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
import { protect, authorize, checkModule } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Middleware de proteção e módulo
router.use(protect);
router.use(checkModule('purchase-requests'));

// Middleware de auditoria para todas as mutações de ordens de compra
router.use(auditMiddleware('PURCHASE_ORDER'));

// Rotas de estatísticas
router.get('/stats', getOrderStats);

// Rotas principais
router.route('/')
    .get(getPurchaseOrders)
    .post(authorize('admin', 'tecnico'), createPurchaseOrder);

// Ações específicas
router.post('/:id/cancel', authorize('admin'), cancelPurchaseOrder);
router.post('/:id/receive', authorize('admin', 'tecnico'), receiveItems);

// CRUD por ID
router.route('/:id')
    .get(getPurchaseOrder)
    .put(authorize('admin', 'tecnico'), updatePurchaseOrder);

export default router;
