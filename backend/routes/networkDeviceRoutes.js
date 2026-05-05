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
    getDevicesByLocation
} from '../controllers/networkDeviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rotas públicas para dashboard (requer autenticação)
router.get('/dashboard', protect, getNetworkDashboard);
router.get('/topology', protect, getNetworkTopology);

// Rotas de listagem e busca
router.get('/', protect, getNetworkDevices);
router.get('/location/:location', protect, getDevicesByLocation);
router.get('/:id', protect, getNetworkDevice);

// Rotas de criação e edição (admin)
router.post('/', protect, authorize('admin'), createNetworkDevice);
router.put('/:id', protect, authorize('admin'), updateNetworkDevice);
router.delete('/:id', protect, authorize('admin'), deleteNetworkDevice);

// Rotas de atualização de status e portas
router.put('/:id/status', protect, updateDeviceStatus);
router.put('/:id/ports', protect, authorize('admin'), updateSwitchPorts);

export default router;
