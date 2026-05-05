import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getMotivos,
    createMotivo,
    updateMotivo,
    deleteMotivo,
    getDowntimeAnalysis
} from '../controllers/pcpDowntimeController.js';

const router = express.Router();

router.use(protect);

router.get('/motivos', getMotivos);
router.post('/motivos', createMotivo);
router.put('/motivos/:id', updateMotivo);
router.delete('/motivos/:id', deleteMotivo);
router.get('/analysis', getDowntimeAnalysis);

export default router;
