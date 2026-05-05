import express from 'express';
import {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    checkAvailability,
    getBudgetReport
} from '../controllers/budgetController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('purchase-requests'));

// Rotas de verificação e relatórios
router.get('/check', checkAvailability);
router.get('/report', getBudgetReport);

// Rotas principais
router.route('/')
    .get(getBudgets)
    .post(authorize('admin'), createBudget);

// CRUD por ID
router.route('/:id')
    .get(getBudget)
    .put(authorize('admin'), updateBudget);

export default router;
