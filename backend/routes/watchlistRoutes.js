import express from 'express';
import {
  getWatchlists,
  createWatchlist,
  addMovieToWatchlist,
  removeMovieFromWatchlist,
  updateMovieStatus,
  deleteWatchlist,
} from '../controllers/watchlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWatchlists);
router.post('/', createWatchlist);
router.delete('/:id', deleteWatchlist);
router.post('/:watchlistId/movies', addMovieToWatchlist);
router.delete('/:watchlistId/movies/:tmdbId', removeMovieFromWatchlist);
router.put('/:watchlistId/movies/:tmdbId/status', updateMovieStatus);

export default router;
