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
import { protect, authorize, checkModule } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('problems'));
router.use(authorize('admin', 'tecnico'));
router.use(auditMiddleware('PROBLEM'));

router.get('/stats/analytics', getProblemStats);

router.route('/')
    .get(getProblems)
    .post(createProblem);

router.route('/:id')
    .get(getProblem)
    .put(updateProblem)
    .delete(authorize('admin'), deleteProblem);

router.post('/:id/incidents/:ticketId', linkIncident);
router.delete('/:id/incidents/:ticketId', unlinkIncident);

export default router;
