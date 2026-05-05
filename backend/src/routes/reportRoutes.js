import express from 'express';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import { getSLASectorReport, getAssetROIReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('reports'));
router.use(authorize('admin', 'tecnico'));

router.get('/sla/sectors', getSLASectorReport);
router.get('/roi/assets', getAssetROIReport);

export default router;
