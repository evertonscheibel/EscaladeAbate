import express from 'express';
import {
    getMaintenances,
    getMaintenance,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    getAssetMaintenances,
    getMaintenanceStats,
    getMaintenanceReport
} from '../controllers/maintenanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rotas protegidas
router.use(protect);

// Rotas de relatórios e estatísticas
router.get('/stats/analytics', getMaintenanceStats);
router.get('/reports/analytics', getMaintenanceReport);

// Rotas de manutenções por ativo
router.get('/asset/:assetId', getAssetMaintenances);

// Rotas CRUD
router.route('/')
    .get(getMaintenances)
    .post(createMaintenance);

router.route('/:id')
    .get(getMaintenance)
    .put(updateMaintenance)
    .delete(deleteMaintenance);

export default router;
