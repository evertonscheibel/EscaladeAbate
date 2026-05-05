import express from 'express';
import {
    getBrokers,
    getBroker,
    createBroker,
    updateBroker,
    deleteBroker
} from '../controllers/deboningBrokerController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkModule('deboning'));

router.route('/')
    .get(getBrokers)
    .post(authorize('admin', 'pcp', 'tecnico'), createBroker);

router.route('/:id')
    .get(getBroker)
    .put(authorize('admin', 'pcp', 'tecnico'), updateBroker)
    .delete(authorize('admin'), deleteBroker);

export default router;
