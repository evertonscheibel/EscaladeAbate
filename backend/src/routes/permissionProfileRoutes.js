import express from 'express';
import {
    getProfiles, getProfileById, createProfile, updateProfile, deleteProfile
} from '../controllers/permissionProfileController.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(auditMiddleware('PERMISSION_PROFILE'));

router.route('/')
    .get(authorize('admin', 'tecnico'), getProfiles)
    .post(authorize('admin'), createProfile);

router.route('/:id')
    .get(authorize('admin', 'tecnico'), getProfileById)
    .put(authorize('admin'), updateProfile)
    .delete(authorize('admin'), deleteProfile);

export default router;
