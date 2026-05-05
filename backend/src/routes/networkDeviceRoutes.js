import express from 'express';
import {
    getNetworkDevices,
    getNetworkDevice,
    createNetworkDevice,
    updateNetworkDevice,
    deleteNetworkDevice,
    updateDeviceStatus,
    getNetworkDashboard,
    getNetworkTopology,
    updateSwitchPorts,
    getDevicesByLocation,
    importNetworkDevices
} from '../controllers/networkDeviceController.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';
import multer from 'multer';
import path from 'multer'; // multer actually, but I'll use it for dest
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

router.use(protect);
router.use(checkModule('network'));

// Rotas públicas para dashboard (requer autenticação)
router.get('/dashboard', getNetworkDashboard);
router.get('/topology', getNetworkTopology);

// Rotas de listagem e busca
router.get('/', getNetworkDevices);
router.get('/location/:location', getDevicesByLocation);
router.get('/:id', getNetworkDevice);

// Rotas de criação e edição (admin)
router.post('/', authorize('admin'), createNetworkDevice);
router.post('/import', authorize('admin'), upload.single('file'), importNetworkDevices);
router.put('/:id', authorize('admin'), updateNetworkDevice);
router.delete('/:id', authorize('admin'), deleteNetworkDevice);

// Rotas de atualização de status e portas
router.put('/:id/status', updateDeviceStatus);
router.put('/:id/ports', authorize('admin'), updateSwitchPorts);

export default router;
