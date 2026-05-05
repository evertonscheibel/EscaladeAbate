import express from 'express';
import { getDashboardKPIs, getRecentActivity, getOperationalDashboard, getAlerts } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/kpis', protect, getDashboardKPIs);
router.get('/recent-activity', protect, getRecentActivity);
router.get('/operational', protect, getOperationalDashboard);
router.get('/alerts', protect, getAlerts);

export default router;
