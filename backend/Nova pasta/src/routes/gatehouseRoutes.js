import express from 'express';
import {
    registerEntry, registerExit, getInPatio, getHistory, getDashboardKPIs, editFinishedAccess
} from '../controllers/gatehouseController.js';
import {
    getVehicles, createVehicle, getPeople, createPerson,
    getCompanies, createCompany, getGatehouses, getAccessTypes, getAccessReasons
} from '../controllers/auxiliaryGatehouseControllers.js';
import { protect, authorize, checkModule } from '../middleware/auth.js';

const router = express.Router();

// Aplica proteção em todas as rotas e verifica acesso ao módulo GEP
router.use(protect);
router.use(checkModule('gep'));

// Operação
router.post('/access/entry', registerEntry);
router.put('/access/:id/exit', registerExit);
router.get('/access/in-patio', getInPatio);
router.get('/access/history', getHistory);
router.get('/dashboard/kpis', getDashboardKPIs);
router.put('/access/:id/edit', authorize('admin', 'guarita_supervisor', 'guarita_admin'), editFinishedAccess);

// Cadastros
router.get('/vehicles', getVehicles);
router.post('/vehicles', createVehicle);
router.get('/people', getPeople);
router.post('/people', createPerson);
router.get('/companies', getCompanies);
router.post('/companies', createCompany);

// Configurações
router.get('/configs/gatehouses', getGatehouses);
router.get('/configs/types', getAccessTypes);
router.get('/configs/reasons', getAccessReasons);

export default router;
