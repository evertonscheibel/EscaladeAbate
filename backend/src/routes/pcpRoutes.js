import express from 'express';
import {
    getCalendar,
    getDayPlan,
    updateDayPlan,
    startDayPlan,
    closeDayPlan,
    getMarkets
} from '../controllers/pcpController.js';
import {
    iniciarOp,
    pausarOp,
    retomarOp,
    finalizarOp,
    getPcpAnalytics,
    getMotivosParada
} from '../controllers/pcpExecutionController.js';
import {
    getExternalLots,
    createExternalLot,
    updateExternalLot,
    deleteExternalLot
} from '../controllers/externalLotController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('pcp'));

// Plano Diário
router.get('/day/:date', getDayPlan);
router.put('/day/:id', authorize('admin', 'tecnico'), updateDayPlan);
router.post('/day/:id/start', authorize('admin', 'tecnico'), startDayPlan);
router.post('/day/:id/close', authorize('admin', 'tecnico'), closeDayPlan);

// Execução de OPs
router.post('/ops/:opId/iniciar', iniciarOp);
router.post('/ops/:opId/pausar', pausarOp);
router.post('/ops/:opId/retomar', retomarOp);
router.post('/ops/:opId/finalizar', finalizarOp);

// Analytics e Metadados
router.get('/programacoes/:id/analytics', getPcpAnalytics);
router.get('/motivos-parada', getMotivosParada);

// Calendário
router.get('/calendar', getCalendar);

// Mercados
router.get('/markets', getMarkets);

// Lotes Externos
router.get('/external-lots', getExternalLots);
router.post('/external-lots', authorize('admin', 'tecnico'), createExternalLot);
router.route('/external-lots/:id')
    .put(authorize('admin', 'tecnico'), updateExternalLot)
    .delete(authorize('admin', 'tecnico'), deleteExternalLot);

export default router;
