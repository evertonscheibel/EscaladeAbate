import express from 'express';
import {
    getOpenPositions,
    getAllPositions,
    getPositionById,
    createPosition,
    updatePosition,
    deletePosition
} from '../controllers/jobPositionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas públicas
router.get('/open', getOpenPositions);

// Rotas protegidas (Admin)
router.get('/', protect, authorize('admin'), getAllPositions);
router.get('/:id', protect, authorize('admin'), getPositionById);
router.post('/', protect, authorize('admin'), createPosition);
router.put('/:id', protect, authorize('admin'), updatePosition);
router.delete('/:id', protect, authorize('admin'), deletePosition);

export default router;
