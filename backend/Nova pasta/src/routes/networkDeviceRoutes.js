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
import { protect, authorize } from '../middleware/auth.js';
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

// Rotas públicas para dashboard (requer autenticação)
router.get('/dashboard', protect, getNetworkDashboard);
router.get('/topology', protect, getNetworkTopology);

// Rotas de listagem e busca
router.get('/', protect, getNetworkDevices);
router.get('/location/:location', protect, getDevicesByLocation);
router.get('/:id', protect, getNetworkDevice);

// Rotas de criação e edição (admin)
router.post('/', protect, authorize('admin'), createNetworkDevice);
router.post('/import', protect, authorize('admin'), upload.single('file'), importNetworkDevices);
router.put('/:id', protect, authorize('admin'), updateNetworkDevice);
router.delete('/:id', protect, authorize('admin'), deleteNetworkDevice);

// Rotas de atualização de status e portas
router.put('/:id/status', protect, updateDeviceStatus);
router.put('/:id/ports', protect, authorize('admin'), updateSwitchPorts);

export default router;
