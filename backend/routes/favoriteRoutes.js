import express from 'express';
import { getFavorites, toggleFavorite, checkFavorite } from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getFavorites);
router.post('/toggle', toggleFavorite);
router.get('/check/:tmdbId', checkFavorite);

export default router;
