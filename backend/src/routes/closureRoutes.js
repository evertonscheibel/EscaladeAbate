import express from 'express';
import {
    getClosureByDate,
    createClosureFromPre,
    updateClosure,
    reorderLines,
    closeClosure,
    reopenClosure,
    exportClosure,
    exportClosurePdf
} from '../controllers/closureController.js';

import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('escala-abate'));

router.get('/:date', getClosureByDate);
router.post('/:date/from-pre', authorize('admin', 'tecnico'), createClosureFromPre);
router.put('/:id', authorize('admin', 'tecnico'), updateClosure);
router.post('/:id/reorder', authorize('admin', 'tecnico'), reorderLines);
router.post('/:id/close', authorize('admin', 'tecnico'), closeClosure);
router.post('/:id/reopen', authorize('admin', 'tecnico'), reopenClosure);
router.get('/:id/export', exportClosure);
router.get('/:id/pdf', exportClosurePdf);


export default router;
