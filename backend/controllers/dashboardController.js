import { WatchHistory } from '../models/WatchHistory.js';
import { Watchlist } from '../models/Watchlist.js';
import { Favorite } from '../models/Favorite.js';
import { Rating } from '../models/Rating.js';
import { RecommendationLog } from '../models/RecommendationLog.js';
import { MovieCache } from '../models/MovieCache.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Gather counts
    const [totalWatched, totalFavorites, ratings, watchlists, recentHistory] = await Promise.all([
      WatchHistory.countDocuments({ userId }),
      Favorite.countDocuments({ userId }),
      Rating.find({ userId }),
      Watchlist.find({ userId }),
      WatchHistory.find({ userId }).sort({ watchedAt: -1 }).limit(6),
    ]);

    // Count movies in watchlists
    let totalWatchlistCount = 0;
    watchlists.forEach(w => {
      totalWatchlistCount += (w.movies || []).length;
    });

    // 2. Calculate Personal Average Rating
    let totalRatingSum = 0;
    const ratingDistribution = [
      { score: '1-2', count: 0 },
      { score: '3-4', count: 0 },
      { score: '5-6', count: 0 },
      { score: '7-8', count: 0 },
      { score: '9-10', count: 0 },
    ];

    ratings.forEach(r => {
      totalRatingSum += r.rating;
      if (r.rating <= 2) ratingDistribution[0].count++;
      else if (r.rating <= 4) ratingDistribution[1].count++;
      else if (r.rating <= 6) ratingDistribution[2].count++;
      else if (r.rating <= 8) ratingDistribution[3].count++;
      else ratingDistribution[4].count++;
    });

    const averageRating = ratings.length > 0 ? Math.round((totalRatingSum / ratings.length) * 10) / 10 : 0;

    // 3. Monthly Watch Activity (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyActivity = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await WatchHistory.countDocuments({
        userId,
        watchedAt: { $gte: d, $lt: nextD },
      });

      monthlyActivity.push({
        month: mLabel,
        moviesWatched: count,
      });
    }

    // 4. Genre breakdown based on user's rated and favorited movies
    const ratedTmdbIds = ratings.map(r => r.tmdbId);
    const moviesRated = await MovieCache.find({ tmdbId: { $in: ratedTmdbIds } }).lean();

    const genreCounts = new Map();
    moviesRated.forEach(m => {
      (m.genres || []).forEach(g => {
        const name = typeof g === 'string' ? g : g.name;
        if (name) {
          genreCounts.set(name, (genreCounts.get(name) || 0) + 1);
        }
      });
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .map(([name, count]) => ({ genre: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5. Recent recommendations log
    const recentLogs = await RecommendationLog.find({ userId }).sort({ createdAt: -1 }).limit(3);

    res.json({
      success: true,
      summary: {
        totalWatched,
        totalFavorites,
        totalWatchlist: totalWatchlistCount,
        totalRatings: ratings.length,
        averageRating,
      },
      recentHistory,
      monthlyActivity,
      favoriteGenres,
      ratingDistribution,
      recommendationHistory: recentLogs,
    });
  } catch (error) {
    next(error);
  }
};
