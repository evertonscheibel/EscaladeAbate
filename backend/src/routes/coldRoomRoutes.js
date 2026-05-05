import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getColdRooms,
    createColdRoom,
    updateColdRoom,
    deleteColdRoom,
    addReading
} from '../controllers/coldRoomController.js';

const router = express.Router();

router.use(protect);

router.get('/', getColdRooms);
router.post('/', createColdRoom);
router.put('/:id', updateColdRoom);
router.delete('/:id', deleteColdRoom);
router.post('/:id/reading', addReading);

export default router;
