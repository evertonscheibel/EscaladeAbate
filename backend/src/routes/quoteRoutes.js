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
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Rotas protegidas
router.use(protect);
router.use(checkModule('purchase-requests'));

// Rotas de comparação (antes das rotas com :id)
router.get('/request/:requestId/compare', compareQuotes);

// Rotas principais
router.route('/')
    .get(getQuotes)
    .post(authorize('admin', 'tecnico'), createQuote);

// Ações específicas
router.post('/:id/select', authorize('admin', 'tecnico'), selectQuote);

// CRUD por ID
router.route('/:id')
    .get(getQuote)
    .put(authorize('admin', 'tecnico'), updateQuote)
    .delete(authorize('admin', 'tecnico'), deleteQuote);

export default router;
