import express from 'express';
import {
    getAssets,
    getAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    getAssetWithDetails,
    getAssetReport,
    importAssets,
    exportAssets,
    clearAllAssets
} from '../controllers/assetController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Garantir que o diretório uploads existe
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer para upload temporário
const upload = multer({
    dest: uploadsDir,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos Excel são permitidos'));
        }
    }
});

// Middleware de proteção e módulo para todas as rotas de ativos
router.use(protect);
router.use(checkModule('assets'));
router.use(auditMiddleware('ASSET'));

router.route('/')
    .get(getAssets)
    .post(authorize('admin', 'tecnico'), createAsset);

router.get('/reports/analytics', authorize('admin', 'tecnico'), getAssetReport);

router.post('/import', authorize('admin'), upload.single('file'), importAssets);
router.get('/export', authorize('admin', 'tecnico'), exportAssets);
router.delete('/clear-all', authorize('admin'), clearAllAssets);

router.route('/:id')
    .get(getAsset)
    .put(authorize('admin', 'tecnico'), updateAsset)
    .delete(authorize('admin'), deleteAsset);

router.get('/:id/details', authorize('admin', 'tecnico'), getAssetWithDetails);

export default router;
