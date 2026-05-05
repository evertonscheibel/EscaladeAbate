import express from 'express';
import {
    getOpenPositions,
    getAllPositions,
    getPositionById
} from '../controllers/jobPositionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas públicas
router.get('/open', getOpenPositions);

// Rotas protegidas (Admin)
router.get('/', protect, authorize('admin'), getAllPositions);
router.get('/:id', protect, authorize('admin'), getPositionById);

export default router;
