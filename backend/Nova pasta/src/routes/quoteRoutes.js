import express from 'express';
import {
    getQuotes,
    getQuote,
    createQuote,
    updateQuote,
    deleteQuote,
    selectQuote,
    compareQuotes
} from '../controllers/quoteController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas de comparação (antes das rotas com :id)
router.get('/request/:requestId/compare', protect, compareQuotes);

// Rotas principais
router.route('/')
    .get(protect, getQuotes)
    .post(protect, authorize('admin', 'tecnico'), createQuote);

// Ações específicas
router.post('/:id/select', protect, authorize('admin', 'tecnico'), selectQuote);

// CRUD por ID
router.route('/:id')
    .get(protect, getQuote)
    .put(protect, authorize('admin', 'tecnico'), updateQuote)
    .delete(protect, authorize('admin', 'tecnico'), deleteQuote);

export default router;
