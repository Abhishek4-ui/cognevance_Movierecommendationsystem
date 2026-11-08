import { tmdbService } from '../services/tmdbService.js';
import { MovieCache } from '../models/MovieCache.js';

export const getApiStatus = async (req, res) => {
  const hasCreds = tmdbService.hasCredentials();
  const authMethod = tmdbService.resolveAuthMethod();
  const cachedCount = await MovieCache.countDocuments();
  res.json({
    success: true,
    hasApiKey: hasCreds,
    hasCredentials: hasCreds,
    authMethod: authMethod || 'none',
    hasV4Token: Boolean(tmdbService.getReadAccessToken()),
    hasV3Key: Boolean(tmdbService.getApiKey()),
    cachedMoviesCount: cachedCount,
    message: hasCreds
      ? `TMDB API is connected and verified (using ${authMethod === 'v4' ? 'v4 Read Access Token' : 'v3 API Key'}).`
      : 'TMDB credentials are not configured. Please supply a TMDB API Read Access Token (v4) or API Key (v3) in settings.',
  });
};

export const updateApiKey = async (req, res) => {
  const { apiKey, readAccessToken, authMethod } = req.body;

  const v4Token = (readAccessToken || '').trim();
  const v3Key = (apiKey || '').trim();
  const method = authMethod || (v4Token ? 'v4' : 'v3');

  if (!v4Token && !v3Key) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one credential: TMDB API Read Access Token (v4) or TMDB API Key (v3).',
    });
  }

  try {
    // 1. Actively verify credentials against live TMDB API
    const verification = await tmdbService.verifyCredentials({
      apiKey: v3Key,
      readAccessToken: v4Token,
      authMethod: method,
    });

    // 2. If valid, update memory and persist securely
    tmdbService.setCredentials({
      apiKey: v3Key,
      readAccessToken: v4Token,
      authMethod: method,
    });

    tmdbService.persistToEnv({
      apiKey: v3Key,
      readAccessToken: v4Token,
      authMethod: method,
    });

    const movieTitle = typeof verification.sampleMovie === 'string'
      ? verification.sampleMovie
      : verification.sampleMovie?.title || 'Verified';

    res.json({
      success: true,
      message: `TMDB authentication verified successfully using ${verification.authMethod.toUpperCase()} credentials.`,
      authMethod: verification.authMethod,
      sampleMovie: movieTitle,
      details: {
        testMovie: movieTitle,
      },
    });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({
      success: false,
      status,
      code: err.code || 'TMDB_AUTH_FAILED',
      message: err.message || 'Failed to authenticate with TMDB.',
    });
  }
};

export const getTrending = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const window = req.query.window || 'day';

    if (!tmdbService.hasApiKey()) {
      // Query local cached movies
      const movies = await MovieCache.find({}).sort({ popularity: -1 }).skip((page - 1) * 20).limit(20);
      return res.json({
        page,
        results: movies,
        totalPages: 1,
        totalResults: movies.length,
        source: 'local_cache',
      });
    }

    const data = await tmdbService.getTrending(window, page);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getPopular = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);

    if (!tmdbService.hasApiKey()) {
      const movies = await MovieCache.find({}).sort({ popularity: -1 }).skip((page - 1) * 20).limit(20);
      return res.json({ page, results: movies, totalPages: 1, totalResults: movies.length, source: 'local_cache' });
    }

    const data = await tmdbService.getPopular(page);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getTopRated = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);

    if (!tmdbService.hasApiKey()) {
      const movies = await MovieCache.find({}).sort({ voteAverage: -1 }).skip((page - 1) * 20).limit(20);
      return res.json({ page, results: movies, totalPages: 1, totalResults: movies.length, source: 'local_cache' });
    }

    const data = await tmdbService.getTopRated(page);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getUpcoming = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);

    if (!tmdbService.hasApiKey()) {
      const movies = await MovieCache.find({}).sort({ releaseDate: -1 }).skip((page - 1) * 20).limit(20);
      return res.json({ page, results: movies, totalPages: 1, totalResults: movies.length, source: 'local_cache' });
    }

    const data = await tmdbService.getUpcoming(page);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getNowPlaying = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);

    if (!tmdbService.hasApiKey()) {
      const movies = await MovieCache.find({}).sort({ popularity: -1 }).skip((page - 1) * 20).limit(20);
      return res.json({ page, results: movies, totalPages: 1, totalResults: movies.length, source: 'local_cache' });
    }

    const data = await tmdbService.getNowPlaying(page);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getTvPopular = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);

    if (!tmdbService.hasApiKey()) {
      return res.json({ page, results: [], totalPages: 0, totalResults: 0, source: 'local_cache' });
    }

    const data = await tmdbService.getTvPopular(page);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getGenres = async (req, res, next) => {
  try {
    if (!tmdbService.hasApiKey()) {
      return res.json([
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentary' },
        { id: 18, name: 'Drama' },
        { id: 10751, name: 'Family' },
        { id: 14, name: 'Fantasy' },
        { id: 36, name: 'History' },
        { id: 27, name: 'Horror' },
        { id: 10402, name: 'Music' },
        { id: 9648, name: 'Mystery' },
        { id: 10749, name: 'Romance' },
        { id: 878, name: 'Science Fiction' },
        { id: 53, name: 'Thriller' },
        { id: 10752, name: 'War' },
        { id: 37, name: 'Western' },
      ]);
    }

    const genres = await tmdbService.getGenres();
    res.json(genres);
  } catch (error) {
    next(error);
  }
};

export const searchMovies = async (req, res, next) => {
  try {
    const { query, year, genreId, language, sortBy, minRating, page } = req.query;

    if (!tmdbService.hasApiKey()) {
      const filter = {};
      if (query) {
        filter.$text = { $search: query };
      }
      if (year) {
        filter.releaseYear = parseInt(year, 10);
      }
      if (minRating) {
        filter.voteAverage = { $gte: parseFloat(minRating) };
      }
      const movies = await MovieCache.find(filter).limit(20);
      return res.json({
        page: 1,
        results: movies,
        totalPages: 1,
        totalResults: movies.length,
        source: 'local_cache',
      });
    }

    const data = await tmdbService.searchMovies({
      query,
      year,
      genreId,
      language,
      sortBy,
      minRating,
      page: parseInt(page || '1', 10),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getMovieDetails = async (req, res, next) => {
  try {
    const tmdbId = parseInt(req.params.id, 10);
    if (!tmdbId || isNaN(tmdbId)) {
      return res.status(400).json({ success: false, message: 'Invalid Movie ID provided.' });
    }

    if (!tmdbService.hasApiKey()) {
      const cached = await MovieCache.findOne({ tmdbId });
      if (!cached) {
        return res.status(404).json({
          success: false,
          code: 'MISSING_TMDB_API_KEY',
          message: 'Movie not in local cache, and TMDB API Key is required to fetch real-time metadata.',
        });
      }
      return res.json(cached);
    }

    const movie = await tmdbService.getMovieDetails(tmdbId);
    res.json(movie);
  } catch (error) {
    next(error);
  }
};

export const getPersonDetails = async (req, res, next) => {
  try {
    const personId = parseInt(req.params.id, 10);
    if (!tmdbService.hasApiKey()) {
      return res.status(400).json({
        success: false,
        message: 'TMDB API key required to view actor/director details.',
      });
    }

    const person = await tmdbService.getPersonDetails(personId);
    res.json(person);
  } catch (error) {
    next(error);
  }
};
