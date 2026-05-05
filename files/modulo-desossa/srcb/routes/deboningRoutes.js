import express from 'express';
import {
    getCalendar,
    getScheduleByDate,
    updateSchedule,
    importFromSlaughter,
    getAvailableSlaughter,
    createLot,
    updateLot,
    updateLotProduction,
    deleteLot,
    recalculateLots,
    reorderLots,
    startSchedule,
    closeSchedule,
    reopenSchedule,
    getProductionSummary
} from '../controllers/deboningController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Garantir que o usuário está logado e tem acesso ao módulo de desossa
router.use(protect);
router.use(checkModule('desossa'));

// Calendário
router.get('/calendar', getCalendar);

// Escalas de abate disponíveis para importação
router.get('/available-slaughter', getAvailableSlaughter);

// Escala por data
router.get('/schedules/:date', getScheduleByDate);

// Atualizar escala
router.put('/schedules/:id', authorize('admin', 'tecnico'), updateSchedule);

// Importar do abate
router.post('/schedules/:scheduleId/import-slaughter/:slaughterDate', authorize('admin', 'tecnico'), importFromSlaughter);

// Criar lote
router.post('/schedules/:scheduleId/lots', authorize('admin', 'tecnico'), createLot);

// Operações em lotes
router.route('/lots/:id')
    .put(authorize('admin', 'tecnico'), updateLot)
    .delete(authorize('admin', 'tecnico'), deleteLot);

// Registrar produção do lote
router.put('/lots/:id/production', authorize('admin', 'tecnico'), updateLotProduction);

// Recalcular horários
router.post('/schedules/:id/recalculate', authorize('admin', 'tecnico'), recalculateLots);

// Reordenar lotes
router.post('/schedules/:id/reorder', authorize('admin', 'tecnico'), reorderLots);

// Iniciar produção
router.post('/schedules/:id/start', authorize('admin', 'tecnico'), startSchedule);

// Fechar programação
router.post('/schedules/:id/close', authorize('admin', 'tecnico'), closeSchedule);

// Reabrir programação
router.post('/schedules/:id/reopen', authorize('admin', 'tecnico'), reopenSchedule);

// Resumo de produção
router.get('/schedules/:id/production-summary', getProductionSummary);

export default router;
