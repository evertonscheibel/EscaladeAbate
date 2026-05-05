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
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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
