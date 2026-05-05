import express from 'express';
import {
    getCalendar,
    getScheduleByDate,
    updateSchedule,
    createLot,
    updateLot,
    deleteLot,
    recalculateLots,
    closeSchedule,
    reopenSchedule,
    reorderLots
} from '../controllers/slaughterController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Garantir que o usuário está logado e tem acesso ao módulo de abate
router.use(protect);
router.use(checkModule('slaughter'));

router.get('/calendar', getCalendar);

router.get('/schedules/:date', getScheduleByDate);

router.put('/schedules/:id', authorize('admin', 'tecnico'), updateSchedule);

router.post('/schedules/:scheduleId/lots', authorize('admin', 'tecnico'), createLot);

router.route('/lots/:id')
    .put(authorize('admin', 'tecnico'), updateLot)
    .delete(authorize('admin', 'tecnico'), deleteLot);

router.post('/schedules/:id/recalculate', authorize('admin', 'tecnico'), recalculateLots);

router.post('/schedules/:id/close', authorize('admin', 'tecnico'), closeSchedule);

router.post('/schedules/:id/reorder', authorize('admin', 'tecnico'), reorderLots);

router.post('/schedules/:id/reopen', authorize('admin'), reopenSchedule);

export default router;
