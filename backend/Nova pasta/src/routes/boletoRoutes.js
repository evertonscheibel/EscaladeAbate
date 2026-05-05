import express from 'express';
import {
    getBoletos,
    getBoleto,
    createBoleto,
    updateBoleto,
    deleteBoleto,
    getPendingBoletos,
    checkDueBoletos,
    updateOverdueBoletos
} from '../controllers/boletoController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'tecnico'), getBoletos)
    .post(protect, authorize('admin', 'tecnico'), createBoleto);

router.get('/pending/list', protect, authorize('admin', 'tecnico'), getPendingBoletos);
router.post('/check-due', protect, authorize('admin', 'tecnico'), checkDueBoletos);
router.post('/update-overdue', protect, authorize('admin', 'tecnico'), updateOverdueBoletos);

router.route('/:id')
    .get(protect, authorize('admin', 'tecnico'), getBoleto)
    .put(protect, authorize('admin', 'tecnico'), updateBoleto)
    .delete(protect, authorize('admin'), deleteBoleto);

export default router;
