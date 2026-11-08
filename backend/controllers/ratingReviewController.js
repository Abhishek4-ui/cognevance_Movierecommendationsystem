import { Rating } from '../models/Rating.js';
import { Review } from '../models/Review.js';
import { Comment } from '../models/Comment.js';
import { MovieCache } from '../models/MovieCache.js';

export const rateMovie = async (req, res, next) => {
  try {
    const { tmdbId, rating } = req.body;
    const numRating = Number(rating);
    const id = Number(tmdbId);

    if (!id || numRating < 1 || numRating > 10) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 10.' });
    }

    const movieMeta = await MovieCache.findOne({ tmdbId: id });

    const updated = await Rating.findOneAndUpdate(
      { userId: req.user._id, tmdbId: id },
      { $set: { rating: numRating, movieTitle: movieMeta?.title || 'Movie' } },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Rating recorded.', rating: updated });
  } catch (error) {
    next(error);
  }
};

export const getUserRating = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const record = await Rating.findOne({ userId: req.user._id, tmdbId });
    res.json({ rating: record?.rating || null });
  } catch (error) {
    next(error);
  }
};

export const getMovieReviews = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const reviews = await Review.find({ tmdbId, isFlagged: false })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    const avgDoc = await Rating.aggregate([
      { $match: { tmdbId } },
      { $group: { _id: '$tmdbId', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    res.json({
      reviews,
      communityRating: avgDoc[0]?.averageRating ? Math.round(avgDoc[0].averageRating * 10) / 10 : null,
      totalRatings: avgDoc[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { tmdbId, title, content, rating, containsSpoilers } = req.body;
    const id = Number(tmdbId);

    if (!id || !title || !content || !rating) {
      return res.status(400).json({ success: false, message: 'Title, review content, and rating are required.' });
    }

    const movieMeta = await MovieCache.findOne({ tmdbId: id });

    // Save or update user rating
    await Rating.findOneAndUpdate(
      { userId: req.user._id, tmdbId: id },
      { $set: { rating: Number(rating), movieTitle: movieMeta?.title || '' } },
      { upsert: true }
    );

    const review = await Review.create({
      userId: req.user._id,
      tmdbId: id,
      movieTitle: movieMeta?.title || 'Movie',
      moviePoster: movieMeta?.posterPath,
      rating: Number(rating),
      title: title.trim(),
      content: content.trim(),
      containsSpoilers: Boolean(containsSpoilers),
    });

    await review.populate('userId', 'name avatar');
    res.status(201).json({ success: true, message: 'Review published.', review });
  } catch (error) {
    next(error);
  }
};

export const toggleLikeReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    const alreadyLiked = review.likes.some(uId => uId.equals(req.user._id));
    if (alreadyLiked) {
      review.likes = review.likes.filter(uId => !uId.equals(req.user._id));
      review.likesCount = Math.max(0, review.likesCount - 1);
    } else {
      review.likes.push(req.user._id);
      review.likesCount += 1;
    }

    await review.save();
    res.json({ success: true, liked: !alreadyLiked, likesCount: review.likesCount });
  } catch (error) {
    next(error);
  }
};

export const addReviewComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
    }

    const comment = await Comment.create({
      reviewId: id,
      userId: req.user._id,
      content: content.trim(),
    });

    await comment.populate('userId', 'name avatar');
    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

export const getReviewComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ reviewId: id }).populate('userId', 'name avatar').sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    next(error);
  }
};
