import express from 'express';
import {
  getApiStatus,
  updateApiKey,
  getTrending,
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getTvPopular,
  getGenres,
  searchMovies,
  getMovieDetails,
  getPersonDetails,
} from '../controllers/movieController.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', getApiStatus);
router.post('/config-key', optionalAuth, updateApiKey);

router.get('/trending', getTrending);
router.get('/popular', getPopular);
router.get('/top-rated', getTopRated);
router.get('/upcoming', getUpcoming);
router.get('/now-playing', getNowPlaying);
router.get('/tv-popular', getTvPopular);
router.get('/genres', getGenres);
router.get('/search', searchMovies);
router.get('/:id', getMovieDetails);
router.get('/person/:id', getPersonDetails);

export default router;
