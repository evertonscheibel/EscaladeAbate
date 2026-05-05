import express from 'express';
import { protect, checkModule } from '../middleware/auth.js';
import * as pacProgramController from '../controllers/pacProgramController.js';
import * as productionAreaController from '../controllers/productionAreaController.js';
import * as checklistModelController from '../controllers/checklistModelController.js';
import * as checklistExecutionController from '../controllers/checklistExecutionController.js';
import * as nonConformityController from '../controllers/nonConformityController.js';
import * as auditPackageController from '../controllers/auditPackageController.js';

const router = express.Router();

// Middleware global para todas as rotas de PAC
router.use(protect);
router.use(checkModule('quality'));

// Programs
router.route('/programs')
    .get(pacProgramController.getPacPrograms)
    .post(pacProgramController.createPacProgram);
router.route('/programs/:id')
    .get(pacProgramController.getPacProgramById)
    .put(pacProgramController.updatePacProgram)
    .delete(pacProgramController.deletePacProgram);

// Areas
router.route('/areas')
    .get(productionAreaController.getProductionAreas)
    .post(productionAreaController.createProductionArea);
router.route('/areas/:id')
    .get(productionAreaController.getProductionAreaById)
    .put(productionAreaController.updateProductionArea)
    .delete(productionAreaController.deleteProductionArea);

// Checklist Models
router.route('/models')
    .get(checklistModelController.getChecklistModels)
    .post(checklistModelController.createChecklistModel);
router.route('/models/:id')
    .get(checklistModelController.getChecklistModelById)
    .put(checklistModelController.updateChecklistModel)
    .delete(checklistModelController.deleteChecklistModel);
router.post('/models/:id/duplicate', checklistModelController.duplicateChecklistModel);

// Executions
router.route('/executions')
    .get(checklistExecutionController.getChecklistExecutions)
    .post(checklistExecutionController.openChecklistExecution);
router.route('/executions/:id')
    .put(checklistExecutionController.updateChecklistExecution);
router.post('/executions/:id/finalize', checklistExecutionController.finalizeChecklistExecution);

// Non-Conformities (CAPA)
router.route('/non-conformities')
    .get(nonConformityController.getNonConformities);
router.route('/non-conformities/:id')
    .get(nonConformityController.getNonConformityById)
    .put(nonConformityController.updateNonConformity);

// Audit Packages
router.route('/audit-packages')
    .get(auditPackageController.getAuditPackages)
    .post(auditPackageController.createAuditPackage);

export default router;
