import express from 'express';
import {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierPerformance,
    updateSupplierRating
} from '../controllers/supplierController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Rotas protegidas
router.use(protect);
router.use(checkModule('purchase-requests'));

// Rotas principais
router.route('/')
    .get(getSuppliers)
    .post(authorize('admin', 'tecnico'), createSupplier);

// Rotas específicas por ID
router.get('/:id/performance', getSupplierPerformance);
router.put('/:id/rating', authorize('admin', 'tecnico'), updateSupplierRating);

router.route('/:id')
    .get(getSupplier)
    .put(authorize('admin', 'tecnico'), updateSupplier)
    .delete(authorize('admin'), deleteSupplier);

export default router;
