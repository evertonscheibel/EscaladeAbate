import express from 'express';
import {
    getArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    searchRelated,
    incrementViews
} from '../controllers/kbController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('knowledge-base'));
router.use(auditMiddleware('KB_ARTICLE'));

router.route('/')
    .get(protect, getArticles)
    .post(protect, authorize('admin', 'tecnico'), createArticle);

router.get('/search/related', protect, searchRelated);

router.route('/:id')
    .get(protect, getArticle)
    .put(protect, authorize('admin', 'tecnico'), updateArticle)
    .delete(protect, authorize('admin'), deleteArticle);

router.put('/:id/views', protect, incrementViews);

export default router;
