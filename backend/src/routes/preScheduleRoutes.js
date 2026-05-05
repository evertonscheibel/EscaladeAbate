import express from 'express';
import {
    getPreCalendar,
    getPreScheduleByDate,
    updatePreSchedule,
    publishPreSchedule,
    bulkSavePreSchedule,
    exportPreSchedulePdf,
    reorderLots
} from '../controllers/preScheduleController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('slaughter'));

router.post('/bulk', authorize('admin', 'tecnico'), bulkSavePreSchedule);

router.get('/calendar', getPreCalendar);
router.get('/:date', getPreScheduleByDate);
router.put('/:id', authorize('admin', 'tecnico'), updatePreSchedule);
router.post('/:id/publish', authorize('admin', 'tecnico'), publishPreSchedule);
router.post('/:id/reorder', authorize('admin', 'tecnico'), reorderLots);
router.get('/:id/pdf', exportPreSchedulePdf);

export default router;
