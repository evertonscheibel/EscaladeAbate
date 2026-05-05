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
import { protect, checkModule } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Middleware de auditoria para todas as mutações de manutenção
router.use(auditMiddleware('MAINTENANCE'));

// Rotas protegidas
router.use(protect);
router.use(checkModule('maintenance'));

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
