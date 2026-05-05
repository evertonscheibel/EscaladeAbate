import express from 'express';
import {
    getProblems,
    getProblem,
    createProblem,
    updateProblem,
    deleteProblem,
    linkIncident,
    unlinkIncident,
    getProblemStats
} from '../controllers/problemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats/analytics', protect, authorize('admin', 'tecnico'), getProblemStats);

router.route('/')
    .get(protect, authorize('admin', 'tecnico'), getProblems)
    .post(protect, authorize('admin', 'tecnico'), createProblem);

router.route('/:id')
    .get(protect, authorize('admin', 'tecnico'), getProblem)
    .put(protect, authorize('admin', 'tecnico'), updateProblem)
    .delete(protect, authorize('admin'), deleteProblem);

router.post('/:id/incidents/:ticketId', protect, authorize('admin', 'tecnico'), linkIncident);
router.delete('/:id/incidents/:ticketId', protect, authorize('admin', 'tecnico'), unlinkIncident);

export default router;
