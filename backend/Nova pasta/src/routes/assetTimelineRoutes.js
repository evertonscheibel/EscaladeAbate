import express from 'express';
import {
    getAssetTimeline,
    createTimelineEvent,
    getTimelineStats,
    getGovernanceReport
} from '../controllers/assetTimelineController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rotas protegidas
router.use(protect);

// Rotas de relatórios
router.get('/reports/governance', getGovernanceReport);

// Rotas de timeline por ativo
router.get('/asset/:assetId', getAssetTimeline);
router.get('/stats/:assetId', getTimelineStats);

// Criar evento na timeline
router.post('/', createTimelineEvent);

export default router;
