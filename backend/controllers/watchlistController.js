import { Watchlist } from '../models/Watchlist.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { MovieCache } from '../models/MovieCache.js';

export const getWatchlists = async (req, res, next) => {
  try {
    const watchlists = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // If user has no watchlist yet, create a default one
    if (watchlists.length === 0) {
      const defaultList = await Watchlist.create({
        userId: req.user._id,
        name: 'My Watchlist',
        isDefault: true,
        isPublic: false,
        movies: [],
      });
      return res.json([defaultList]);
    }

    res.json(watchlists);
  } catch (error) {
    next(error);
  }
};

export const createWatchlist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Watchlist name is required.' });
    }

    const list = await Watchlist.create({
      userId: req.user._id,
      name: name.trim(),
      description: description || '',
      isPublic: Boolean(isPublic),
      movies: [],
    });

    res.status(201).json({ success: true, watchlist: list });
  } catch (error) {
    next(error);
  }
};

export const addMovieToWatchlist = async (req, res, next) => {
  try {
    const { watchlistId } = req.params;
    const { tmdbId, status = 'want_to_watch' } = req.body;

    if (!tmdbId) {
      return res.status(400).json({ success: false, message: 'tmdbId is required.' });
    }

    const watchlist = await Watchlist.findOne({ _id: watchlistId, userId: req.user._id });
    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist not found.' });
    }

    const exists = watchlist.movies.some(m => m.tmdbId === Number(tmdbId));
    if (exists) {
      return res.status(409).json({ success: false, message: 'Movie is already in this watchlist.' });
    }

    // Get movie metadata from cache
    const movieMeta = await MovieCache.findOne({ tmdbId: Number(tmdbId) });

    watchlist.movies.push({
      tmdbId: Number(tmdbId),
      title: movieMeta?.title || req.body.title || 'Movie',
      posterPath: movieMeta?.posterPath || req.body.posterPath,
      backdropPath: movieMeta?.backdropPath,
      voteAverage: movieMeta?.voteAverage,
      releaseDate: movieMeta?.releaseDate,
      genres: (movieMeta?.genres || []).map(g => g.name),
      status,
      addedAt: new Date(),
    });

    await watchlist.save();

    // If marked as watched, sync to WatchHistory as well
    if (status === 'watched') {
      await WatchHistory.create({
        userId: req.user._id,
        tmdbId: Number(tmdbId),
        title: movieMeta?.title || req.body.title || 'Movie',
        posterPath: movieMeta?.posterPath || req.body.posterPath,
      });
    }

    res.json({ success: true, message: 'Movie added to watchlist.', watchlist });
  } catch (error) {
    next(error);
  }
};

export const removeMovieFromWatchlist = async (req, res, next) => {
  try {
    const { watchlistId, tmdbId } = req.params;
    const watchlist = await Watchlist.findOne({ _id: watchlistId, userId: req.user._id });

    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist not found.' });
    }

    watchlist.movies = watchlist.movies.filter(m => m.tmdbId !== Number(tmdbId));
    await watchlist.save();

    res.json({ success: true, message: 'Movie removed from watchlist.', watchlist });
  } catch (error) {
    next(error);
  }
};

export const updateMovieStatus = async (req, res, next) => {
  try {
    const { watchlistId, tmdbId } = req.params;
    const { status } = req.body;

    const watchlist = await Watchlist.findOne({ _id: watchlistId, userId: req.user._id });
    if (!watchlist) return res.status(404).json({ success: false, message: 'Watchlist not found.' });

    const item = watchlist.movies.find(m => m.tmdbId === Number(tmdbId));
    if (!item) return res.status(404).json({ success: false, message: 'Movie not found in watchlist.' });

    item.status = status;
    await watchlist.save();

    if (status === 'watched') {
      await WatchHistory.create({
        userId: req.user._id,
        tmdbId: Number(tmdbId),
        title: item.title,
        posterPath: item.posterPath,
      });
    }

    res.json({ success: true, message: 'Status updated.', item });
  } catch (error) {
    next(error);
  }
};

export const deleteWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const watchlist = await Watchlist.findOneAndDelete({ _id: id, userId: req.user._id, isDefault: { $ne: true } });
    if (!watchlist) {
      return res.status(400).json({ success: false, message: 'Cannot delete default watchlist or watchlist not found.' });
    }
    res.json({ success: true, message: 'Watchlist deleted.' });
  } catch (error) {
    next(error);
  }
};
