import express from 'express';
import {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    addComment,
    getTicketStats,
    createPublicTicket,
    getAgentReport,
    exportAgentReport,
    getAgentActivityReport
} from '../controllers/ticketController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Rota pública (sem autenticação)
router.post('/public', createPublicTicket);

// Middleware de proteção e módulo para todas as rotas autenticadas
router.use(protect);
router.use(checkModule('gestao-ti'));

router.route('/')
    .get(getTickets)
    .post(createTicket);

router.get('/stats/summary', authorize('admin', 'tecnico'), getTicketStats);
router.get('/reports/agents', authorize('admin', 'tecnico'), getAgentReport);
router.get('/reports/agents/activity', authorize('admin', 'tecnico'), getAgentActivityReport);
router.get('/reports/agents/export', authorize('admin', 'tecnico'), exportAgentReport);

router.route('/:id')
    .get(getTicket)
    .put(authorize('admin', 'tecnico'), updateTicket);

router.post('/:id/comments', addComment);

import * as workflow from '../controllers/ticketWorkflowController.js';

// Rotas de Workflow e Filas (Antes de /:id)
router.post('/queue/next', authorize('admin', 'tecnico'), workflow.getNextTicket);
router.get('/metrics/agents', authorize('admin', 'tecnico'), workflow.getAgentMetrics);

router.post('/:id/assign', authorize('admin', 'tecnico'), workflow.assignTicket);
router.post('/:id/accept', authorize('admin', 'tecnico'), workflow.acceptTicket);
router.post('/:id/start', authorize('admin', 'tecnico'), workflow.startTicket);
router.post('/:id/pending', authorize('admin', 'tecnico'), workflow.pendingTicket);
router.post('/:id/resolve', authorize('admin', 'tecnico'), workflow.resolveTicket);
router.post('/:id/close', workflow.closeTicket);
router.post('/:id/reopen', authorize('admin', 'tecnico'), workflow.reopenTicket);
router.get('/:id/events', workflow.getTicketEvents);

export default router;
