import express from 'express';
import {
  getPersonalized,
  getSimilar,
  getMoodRecommendations,
  getModelStatus,
  trainModel,
} from '../controllers/recommendationController.js';
import { optionalAuth, authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/personalized', optionalAuth, getPersonalized);
router.get('/similar/:id', getSimilar);
router.get('/mood', getMoodRecommendations);
router.get('/model-status', getModelStatus);
router.post('/train', authenticate, requireAdmin, trainModel);

export default router;
