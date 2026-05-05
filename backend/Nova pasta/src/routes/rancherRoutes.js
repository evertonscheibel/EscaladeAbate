import express from 'express';
import {
    searchRanchers,
    getRanchers,
    createRancher,
    updateRancher,
    deleteRancher
} from '../controllers/rancherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', protect, searchRanchers);

router.route('/')
    .get(protect, getRanchers)
    .post(protect, authorize('admin', 'tecnico'), createRancher);

router.route('/:id')
    .put(protect, authorize('admin', 'tecnico'), updateRancher)
    .delete(protect, authorize('admin'), deleteRancher);

export default router;
