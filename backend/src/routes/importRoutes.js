import express from 'express';
import multer from 'multer';
import {
    uploadImport,
    getJobStatus,
    commitImport
} from '../controllers/importController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.post('/upload', authorize('admin', 'tecnico'), upload.single('file'), uploadImport);
router.get('/jobs/:id', getJobStatus);
router.post('/jobs/:id/commit', authorize('admin', 'tecnico'), commitImport);

export default router;
