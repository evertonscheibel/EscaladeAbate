import express from 'express';
import {
    getCuts,
    createCut,
    updateCut,
    deleteCut
} from '../controllers/deboningCutController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cut-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(protect);
router.use(checkModule('deboning'));

router.route('/')
    .get(getCuts)
    .post(authorize('admin', 'pcp', 'tecnico'), upload.single('image'), createCut);

router.route('/:id')
    .put(authorize('admin', 'pcp', 'tecnico'), upload.single('image'), updateCut)
    .delete(authorize('admin'), deleteCut);

export default router;
