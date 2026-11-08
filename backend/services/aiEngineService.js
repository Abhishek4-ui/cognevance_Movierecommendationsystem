import { RecommendationPipeline } from '../../ai-engine/index.js';
import { MovieCache } from '../models/MovieCache.js';
import { Rating } from '../models/Rating.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { Favorite } from '../models/Favorite.js';
import { Watchlist } from '../models/Watchlist.js';
import { RecommendationLog } from '../models/RecommendationLog.js';
import { tmdbService } from './tmdbService.js';

class AiEngineService {
  constructor() {
    this.pipeline = new RecommendationPipeline();
    this.isInitialized = false;
    this.isTraining = false;
  }

  /**
   * Sync movies and interactions from DB and train the recommendation models
   */
  async syncAndTrain() {
    if (this.isTraining) return;
    this.isTraining = true;

    try {
      // 1. Load movies from database cache
      let movies = await MovieCache.find({}).lean();

      // If database cache is empty and TMDB is configured, prime cache with top movies
      if (movies.length < 10 && tmdbService.hasApiKey()) {
        try {
          const popular = await tmdbService.getPopular(1);
          for (const item of (popular.results || []).slice(0, 15)) {
            await tmdbService.getMovieDetails(item.tmdbId).catch(() => null);
          }
          movies = await MovieCache.find({}).lean();
        } catch (e) {
          console.warn('[AI Service] TMDB fetch during priming failed or skipped:', e.message);
        }
      }

      // 2. Aggregate all user interactions
      const [ratings, history, favorites, watchlists] = await Promise.all([
        Rating.find({}).lean(),
        WatchHistory.find({}).lean(),
        Favorite.find({}).lean(),
        Watchlist.find({}).lean(),
      ]);

      const interactions = [];

      ratings.forEach(r => {
        interactions.push({
          userId: r.userId.toString(),
          tmdbId: r.tmdbId,
          rating: r.rating,
          type: 'rating',
        });
      });

      favorites.forEach(f => {
        interactions.push({
          userId: f.userId.toString(),
          tmdbId: f.tmdbId,
          rating: 9.0,
          type: 'favorite',
        });
      });

      history.forEach(h => {
        interactions.push({
          userId: h.userId.toString(),
          tmdbId: h.tmdbId,
          rating: h.rating || 8.0,
          type: 'watched',
        });
      });

      watchlists.forEach(w => {
        (w.movies || []).forEach(m => {
          interactions.push({
            userId: w.userId.toString(),
            tmdbId: m.tmdbId,
            rating: 7.0,
            type: 'watchlist',
          });
        });
      });

      // 3. Train AI Pipeline
      const result = await this.pipeline.trainPipeline(movies, interactions);
      this.isInitialized = true;
      console.log(`[AI Engine] Model trained successfully: ${movies.length} movies, ${interactions.length} interactions.`);
      return result;
    } catch (err) {
      console.error('[AI Engine Error] Model training failed:', err.message);
      throw err;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId, topK = 12) {
    if (!this.isInitialized) {
      await this.syncAndTrain().catch(() => null);
    }

    const [userRatings, userHistory, userFavs] = await Promise.all([
      Rating.find({ userId }).lean(),
      WatchHistory.find({ userId }).lean(),
      Favorite.find({ userId }).lean(),
    ]);

    const userInteractions = [];
    userRatings.forEach(r => userInteractions.push({ tmdbId: r.tmdbId, rating: r.rating }));
    userFavs.forEach(f => userInteractions.push({ tmdbId: f.tmdbId, rating: 9.0 }));
    userHistory.forEach(h => userInteractions.push({ tmdbId: h.tmdbId, rating: h.rating || 8.0 }));

    const excludeIds = userInteractions.map(i => i.tmdbId);
    const popularCatalog = await MovieCache.find({}).sort({ voteAverage: -1, popularity: -1 }).limit(30).lean();

    const start = Date.now();
    const recommendations = await this.pipeline.getRecommendations({
      userId: userId ? userId.toString() : 'guest',
      userInteractions,
      excludeIds,
      popularCatalog,
      topK,
    });
    const execTime = Date.now() - start;

    // Log recommendation event
    if (userId) {
      RecommendationLog.create({
        userId,
        algorithm: 'hybrid',
        inputContext: { userInteractionsCount: userInteractions.length },
        recommendations: recommendations.map(r => ({
          tmdbId: r.tmdbId,
          title: r.movie?.title || '',
          score: r.score,
          explanation: r.explanation,
        })),
        executionTimeMs: execTime,
      }).catch(err => console.warn('Recommendation log failed:', err.message));
    }

    return recommendations;
  }

  /**
   * Get content-similar movies for a given movie
   */
  async getSimilarMovies(tmdbId, topK = 10) {
    const id = Number(tmdbId);
    let cached = await MovieCache.findOne({ tmdbId: id });
    if (!cached && tmdbService.hasApiKey()) {
      cached = await tmdbService.getMovieDetails(id).catch(() => null);
      if (cached) {
        await this.syncAndTrain().catch(() => null);
      }
    }

    const similar = this.pipeline.getSimilarMovies(id, topK);
    return similar;
  }

  /**
   * Mood-based recommendation logic
   * Maps human mood to cinematic parameters (genres, pace, tone, themes)
   */
  async getMoodRecommendations(mood, { genreId, minRating = 6.0, topK = 10 } = {}) {
    // Mood mapped to TMDB genre IDs
    // 28: Action, 12: Adventure, 16: Animation, 35: Comedy, 80: Crime, 99: Documentary,
    // 18: Drama, 10751: Family, 14: Fantasy, 36: History, 27: Horror, 10402: Music,
    // 9648: Mystery, 10749: Romance, 878: Sci-Fi, 53: Thriller, 10752: War, 37: Western
    const moodGenreMap = {
      happy: [35, 16, 10751, 10402],        // Comedy, Animation, Family, Music
      sad: [18, 10749],                      // Drama, Romance
      romantic: [10749, 35],                 // Romance, Comedy
      excited: [28, 12, 878, 53],            // Action, Adventure, Sci-Fi, Thriller
      relaxed: [16, 99, 10751, 35],          // Animation, Documentary, Family
      motivated: [18, 36, 12],               // Drama, History, Adventure
      scared: [27, 9648, 53],                // Horror, Mystery, Thriller
      curious: [878, 9648, 99],              // Sci-Fi, Mystery, Documentary
      family_time: [10751, 16, 35, 12],      // Family, Animation, Comedy, Adventure
      adventure: [12, 28, 14, 878],          // Adventure, Action, Fantasy, Sci-Fi
    };

    const targetMood = (mood || 'happy').toLowerCase();
    const primaryGenres = moodGenreMap[targetMood] || [35, 28, 18];

    const query = {
      voteAverage: { $gte: Number(minRating) },
    };

    if (genreId) {
      query['genres.id'] = Number(genreId);
    } else {
      query['genres.id'] = { $in: primaryGenres };
    }

    let movies = await MovieCache.find(query).sort({ voteAverage: -1, popularity: -1 }).limit(topK).lean();

    // If local cache has few matches and TMDB is available, query TMDB discover
    if (movies.length < topK && tmdbService.hasApiKey()) {
      try {
        const tmdbResults = await tmdbService.searchMovies({
          genreId: genreId || primaryGenres[0],
          minRating,
          sortBy: 'vote_average.desc',
          page: 1,
        });
        return (tmdbResults.results || []).slice(0, topK).map(m => ({
          tmdbId: m.tmdbId,
          movie: m,
          score: m.voteAverage / 10,
          mood: targetMood,
          explanation: `Tailored for your "${targetMood}" mood based on critical acclaim and genre tone.`,
        }));
      } catch (err) {
        // Fall back to local
      }
    }

    return movies.map(m => ({
      tmdbId: m.tmdbId,
      movie: m,
      score: m.voteAverage / 10,
      mood: targetMood,
      explanation: `Tailored for your "${targetMood}" mood based on critical acclaim and genre tone.`,
    }));
  }

  /**
   * AI Movie Chatbot query parser and contextual recommendation
   */
  async handleChatQuery({ query, conversationHistory = [], userId }) {
    const qLower = (query || '').toLowerCase();

    // 1. Check if user mentions mood
    const moods = ['happy', 'sad', 'romantic', 'excited', 'relaxed', 'motivated', 'scared', 'curious', 'family', 'adventure'];
    const matchedMood = moods.find(m => qLower.includes(m));

    // 2. Check if user mentions director
    const directorMatches = ['nolan', 'tarantino', 'spielberg', 'scorsese', 'fincher', 'villeneuve'];
    const matchedDirector = directorMatches.find(d => qLower.includes(d));

    // 3. Check for "similar to [Movie]" or "like [Movie]"
    const likeMatch = query.match(/(?:like|similar to|recommend something like)\s+([a-zA-Z0-9\s:_-]+)/i);

    let suggestions = [];
    let responseText = '';

    if (likeMatch && likeMatch[1]) {
      const movieName = likeMatch[1].trim();
      const searchRes = await MovieCache.findOne({ title: new RegExp(movieName, 'i') });
      if (searchRes) {
        const similar = await this.getSimilarMovies(searchRes.tmdbId, 4);
        suggestions = similar.map(s => s.movie).filter(Boolean);
        responseText = `Based on your love for "${searchRes.title}", I analyzed its narrative themes, genres, and direction. Here are top recommendations calculated by our content-based engine:`;
      } else {
        responseText = `I searched for movies matching "${movieName}". Here are compelling recommendations curated by our neural ranking system:`;
        suggestions = await this.getPersonalizedRecommendations(userId, 4).then(list => list.map(l => l.movie).filter(Boolean));
      }
    } else if (matchedMood) {
      const moodRecs = await this.getMoodRecommendations(matchedMood === 'family' ? 'family_time' : matchedMood, { topK: 4 });
      suggestions = moodRecs.map(r => r.movie).filter(Boolean);
      responseText = `I sense you are looking for a "${matchedMood}" vibe! Here are top films calibrated to match that mood:`;
    } else {
      // General or personalized query
      const recs = await this.getPersonalizedRecommendations(userId, 4);
      suggestions = recs.map(r => r.movie).filter(Boolean);
      responseText = `Here are personalized picks generated by our hybrid machine learning engine, factoring in critical ratings, genre affinities, and collaborative user clusters:`;
    }

    return {
      text: responseText,
      movieSuggestions: suggestions,
    };
  }
}

export const aiEngineService = new AiEngineService();
