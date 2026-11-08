import express from 'express';
import {
  getAdminStats,
  getUsersList,
  updateUserRole,
  getReportsList,
  resolveReport,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getUsersList);
router.put('/users/:id/role', updateUserRole);
router.get('/reports', getReportsList);
router.put('/reports/:id', resolveReport);

export default router;
