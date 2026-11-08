import express from 'express';
import {
  rateMovie,
  getUserRating,
  getMovieReviews,
  createReview,
  toggleLikeReview,
  getReviewComments,
  addReviewComment,
} from '../controllers/ratingReviewController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/ratings/:tmdbId', authenticate, getUserRating);
router.post('/ratings', authenticate, rateMovie);

router.get('/reviews/:tmdbId', optionalAuth, getMovieReviews);
router.post('/reviews', authenticate, createReview);
router.post('/reviews/:id/like', authenticate, toggleLikeReview);
router.get('/reviews/:id/comments', getReviewComments);
router.post('/reviews/:id/comments', authenticate, addReviewComment);

export default router;
