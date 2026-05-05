import express from 'express';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import {
    createCandidate,
    getAllCandidates,
    getCandidateById,
    updateCandidate,
    updateCandidateStatus,
    assignCandidate,
    addNote,
    scheduleInterview,
    updateInterview,
    addDocument,
    getRecruitmentDashboard,
    deleteCandidate,
    lgpdCleanup
} from '../controllers/candidateController.js';

const router = express.Router();

// Rota pública - formulário de candidatura
router.post('/public', createCandidate);

// Rotas protegidas
router.use(protect);
router.use(checkModule('candidates'));

// Dashboard
router.get('/dashboard', authorize('admin', 'tecnico'), getRecruitmentDashboard);

// CRUD
router.get('/', authorize('admin', 'tecnico'), getAllCandidates);
router.post('/', authorize('admin', 'tecnico'), createCandidate);
router.get('/:id', authorize('admin', 'tecnico'), getCandidateById);
router.put('/:id', authorize('admin', 'tecnico'), updateCandidate);
router.delete('/:id', authorize('admin'), deleteCandidate);

// Status e atribuição
router.patch('/:id/status', authorize('admin', 'tecnico'), updateCandidateStatus);
router.patch('/:id/assign', authorize('admin', 'tecnico'), assignCandidate);

// Notas
router.post('/:id/notes', authorize('admin', 'tecnico'), addNote);

// Entrevistas
router.post('/:id/interviews', authorize('admin', 'tecnico'), scheduleInterview);
router.patch('/:id/interviews/:interviewId', authorize('admin', 'tecnico'), updateInterview);

// Documentos
router.post('/:id/documents', authorize('admin', 'tecnico'), addDocument);

// LGPD
router.post('/lgpd/cleanup', authorize('admin'), lgpdCleanup);

export default router;
