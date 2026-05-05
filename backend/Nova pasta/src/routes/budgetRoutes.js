import express from 'express';
import {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    checkAvailability,
    getBudgetReport
} from '../controllers/budgetController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas de verificação e relatórios
router.get('/check', protect, checkAvailability);
router.get('/report', protect, getBudgetReport);

// Rotas principais
router.route('/')
    .get(protect, getBudgets)
    .post(protect, authorize('admin'), createBudget);

// CRUD por ID
router.route('/:id')
    .get(protect, getBudget)
    .put(protect, authorize('admin'), updateBudget);

export default router;
