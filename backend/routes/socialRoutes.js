import express from 'express';
import { toggleFollowUser, getPublicFeed, getUserPublicProfile } from '../controllers/socialController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/feed', getPublicFeed);
router.get('/profile/:id', optionalAuth, getUserPublicProfile);
router.post('/follow/:targetUserId', authenticate, toggleFollowUser);

export default router;
