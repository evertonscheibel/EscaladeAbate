import express from 'express';
import {
    getCertificates,
    getCertificate,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    getExpiringCertificates,
    checkExpiringCertificates
} from '../controllers/certificateController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Garantir que o diretório uploads existe
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
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
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


router.use(protect);
router.use(checkModule('certificates'));

router.route('/')
    .get(getCertificates)
    .post(authorize('admin', 'tecnico'), upload.single('image'), createCertificate);

router.get('/expiring/soon', protect, authorize('admin', 'tecnico'), getExpiringCertificates);
router.post('/check-expiration', protect, authorize('admin', 'tecnico'), checkExpiringCertificates);

router.route('/:id')
    .get(protect, getCertificate)
    .put(protect, authorize('admin', 'tecnico'), upload.single('image'), updateCertificate)
    .delete(protect, authorize('admin'), deleteCertificate);

export default router;
