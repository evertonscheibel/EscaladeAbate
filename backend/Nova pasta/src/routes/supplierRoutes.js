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
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas principais
router.route('/')
    .get(protect, getSuppliers)
    .post(protect, authorize('admin', 'tecnico'), createSupplier);

// Rotas específicas por ID
router.get('/:id/performance', protect, getSupplierPerformance);
router.put('/:id/rating', protect, authorize('admin', 'tecnico'), updateSupplierRating);

router.route('/:id')
    .get(protect, getSupplier)
    .put(protect, authorize('admin', 'tecnico'), updateSupplier)
    .delete(protect, authorize('admin'), deleteSupplier);

export default router;
