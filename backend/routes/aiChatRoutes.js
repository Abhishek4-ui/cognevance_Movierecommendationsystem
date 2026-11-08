import express from 'express';
import { handleChatMessage, getChatHistory, deleteConversation } from '../controllers/aiChatController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', optionalAuth, handleChatMessage);
router.get('/history', optionalAuth, getChatHistory);
router.delete('/history/:id', authenticate, deleteConversation);

export default router;
