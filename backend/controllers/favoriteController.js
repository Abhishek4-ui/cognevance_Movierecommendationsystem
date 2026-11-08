import { Favorite } from '../models/Favorite.js';
import { MovieCache } from '../models/MovieCache.js';

export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(favorites);
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req, res, next) => {
  try {
    const { tmdbId, title, posterPath, voteAverage, releaseDate } = req.body;
    const id = Number(tmdbId);

    const existing = await Favorite.findOne({ userId: req.user._id, tmdbId: id });
    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.json({ success: true, isFavorite: false, message: 'Removed from favorites.' });
    }

    const movieMeta = await MovieCache.findOne({ tmdbId: id });
    const fav = await Favorite.create({
      userId: req.user._id,
      tmdbId: id,
      title: movieMeta?.title || title || 'Movie',
      posterPath: movieMeta?.posterPath || posterPath,
      backdropPath: movieMeta?.backdropPath,
      voteAverage: movieMeta?.voteAverage || voteAverage,
      releaseDate: movieMeta?.releaseDate || releaseDate,
    });

    res.status(201).json({ success: true, isFavorite: true, message: 'Added to favorites.', favorite: fav });
  } catch (error) {
    next(error);
  }
};

export const checkFavorite = async (req, res, next) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const existing = await Favorite.findOne({ userId: req.user._id, tmdbId });
    res.json({ isFavorite: Boolean(existing) });
  } catch (error) {
    next(error);
  }
};
