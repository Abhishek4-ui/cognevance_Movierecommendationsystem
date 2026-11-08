import express from 'express';
import { getDashboardAnalytics } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/analytics', authenticate, getDashboardAnalytics);

export default router;
