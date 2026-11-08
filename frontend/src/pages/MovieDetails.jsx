import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Globe,
  Play,
  Heart,
  Bookmark,
  Share2,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Loader2,
  Film,
  Send,
} from 'lucide-react';
import { moviesApi, recsApi, favoritesApi, ratingsReviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import RatingModal from '../components/RatingModal';
import WatchlistModal from '../components/WatchlistModal';

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], communityRating: null, totalRatings: 0 });
  const [userRating, setUserRating] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  // Review form state
  const [reviewHeadline, setReviewHeadline] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(8);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [movieRes, similarRes, reviewsRes] = await Promise.allSettled([
        moviesApi.getDetails(id),
        recsApi.getSimilar(id, 8),
        ratingsReviewsApi.getReviews(id),
      ]);

      if (movieRes.status === 'fulfilled' && movieRes.value.data) {
        setMovie(movieRes.value.data);
      }

      if (similarRes.status === 'fulfilled' && similarRes.value.data?.similar) {
        setSimilarMovies(similarRes.value.data.similar);
      }

      if (reviewsRes.status === 'fulfilled') {
        setReviewsData(reviewsRes.value.data || { reviews: [], communityRating: null, totalRatings: 0 });
      }

      if (user) {
        favoritesApi.check(id).then(r => setIsFavorite(Boolean(r.data?.isFavorite))).catch(() => {});
        ratingsReviewsApi.getUserRating(id).then(r => setUserRating(r.data?.rating)).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    window.scrollTo(0, 0);
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Please log in to add to favorites.');
      return;
    }
    try {
      const res = await favoritesApi.toggle({
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        voteAverage: movie.voteAverage,
        releaseDate: movie.releaseDate,
      });
      setIsFavorite(res.data?.isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Check out ${movie.title} on CineAI!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to post a review.');
      return;
    }
    if (!reviewHeadline.trim() || !reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await ratingsReviewsApi.createReview({
        tmdbId: movie.tmdbId,
        title: reviewHeadline.trim(),
        content: reviewText.trim(),
        rating: reviewScore,
      });

      setReviewsData(prev => ({
        ...prev,
        reviews: [res.data.review, ...prev.reviews],
      }));
      setReviewHeadline('');
      setReviewText('');
      setUserRating(reviewScore);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!user) {
      alert('Please log in to like reviews.');
      return;
    }
    try {
      const res = await ratingsReviewsApi.likeReview(reviewId);
      setReviewsData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r._id === reviewId ? { ...r, likesCount: res.data?.likesCount } : r),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-electric-400" />
        <p className="text-xs text-slate-400">Loading film presentation and AI features...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
        <p className="text-xs text-slate-400">
          This film might not exist in the catalog or TMDB API credentials are required.
        </p>
        <Link to="/explore" className="inline-block px-5 py-2.5 glow-button text-xs font-bold text-white rounded-xl">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Backdrop & Hero Overview */}
      <div className="relative min-h-[550px] w-full flex items-end overflow-hidden pb-10">
        {movie.backdropPath && (
          <img
            src={movie.backdropPath}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-25 scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          {/* Poster */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="aspect-[2/3] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900">
              {movie.posterPath ? (
                <img src={movie.posterPath} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
              )}
            </div>
          </div>

          {/* Details & Actions */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(movie.genres || []).map((g, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300"
                >
                  {typeof g === 'string' ? g : g.name}
                </span>
              ))}
              {movie.releaseYear && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {movie.releaseYear}
                </span>
              )}
              {movie.runtime > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.runtime} min
                </span>
              )}
              {movie.originalLanguage && (
                <span className="flex items-center gap-1 text-xs text-slate-400 uppercase">
                  <Globe className="w-3.5 h-3.5" />
                  {movie.originalLanguage}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
              {movie.title}
            </h1>

            {/* Ratings Row */}
            <div className="flex items-center gap-6 py-1">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                <div>
                  <div className="text-xl font-bold text-white">
                    {movie.voteAverage || 0} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">TMDB Score</span>
                </div>
              </div>

              {reviewsData.communityRating && (
                <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
                  <Sparkles className="w-5 h-5 text-electric-400" />
                  <div>
                    <div className="text-xl font-bold text-electric-300">
                      {reviewsData.communityRating} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Community ({reviewsData.totalRatings})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
              {movie.overview}
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {movie.trailerKey && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="px-5 py-2.5 glow-button rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 transition hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                onClick={() => setIsWatchlistOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2 transition"
              >
                <Bookmark className="w-4 h-4 text-electric-400" />
                <span>Add to Watchlist</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-400' : ''}`} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                onClick={() => {
                  if (!user) return alert('Please log in to rate movies.');
                  setIsRatingOpen(true);
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
                  userRating
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-200'
                }`}
              >
                <Star className={`w-4 h-4 ${userRating ? 'fill-current text-amber-400' : ''}`} />
                <span>{userRating ? `Rated: ${userRating}/10` : 'Rate Film'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition"
                title="Share Film"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Streaming Availability */}
        {movie.streamingProviders && movie.streamingProviders.length > 0 && (
          <section className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Verified Streaming Availability
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              {movie.streamingProviders.map((prov, idx) => (
                <div key={idx} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700">
                  {prov.logoPath && (
                    <img src={prov.logoPath} alt={prov.providerName} className="w-6 h-6 rounded-md object-cover" />
                  )}
                  <span className="text-xs font-semibold text-slate-200">{prov.providerName}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Cast & Crew */}
        {movie.cast && movie.cast.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-white font-display">Top Billed Cast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {movie.cast.slice(0, 8).map((actor) => (
                <Link
                  key={actor.id}
                  to={`/actor/${actor.id}`}
                  className="group p-2 rounded-xl bg-navy-900/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-900 mb-2">
                    {actor.profilePath ? (
                      <img
                        src={actor.profilePath}
                        alt={actor.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Photo</div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white group-hover:text-electric-400 transition line-clamp-1">
                    {actor.name}
                  </p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{actor.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Content-Based Similar Movies Row */}
        {similarMovies.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-electric-400" />
                  <span>Because You Watched {movie.title}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Curated for fans of this movie's story, tone, and direction
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {similarMovies.map((sim) => (
                <MovieCard
                  key={sim.tmdbId}
                  movie={sim.movie || { tmdbId: sim.tmdbId, title: 'Similar Film' }}
                  score={sim.score}
                  confidence={Math.round(sim.score * 100)}
                  explanation={sim.explanation}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews & Ratings Section */}
        <section className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-electric-400" />
              <h3 className="text-xl font-bold text-white font-display">User Reviews & Critical Discussion</h3>
            </div>
            <span className="text-xs text-slate-400">{reviewsData.reviews?.length || 0} Reviews</span>
          </div>

          {/* Write a Review Form */}
          {user ? (
            <form onSubmit={handleReviewSubmit} className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white">Write Your Review</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <input
                    type="text"
                    value={reviewHeadline}
                    onChange={(e) => setReviewHeadline(e.target.value)}
                    placeholder="Review headline (e.g., A visual masterpiece with haunting emotional resonance)"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-400"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <select
                    value={reviewScore}
                    onChange={(e) => setReviewScore(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => (
                      <option key={s} value={s}>{s} / 10</option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                placeholder="Share your thoughts on the narrative pacing, cinematography, performances, and themes..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-400 resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 glow-button text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
              <Link to="/login" className="text-electric-400 font-semibold underline">Log in</Link> to share your review and rate this film.
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsData.reviews?.length > 0 ? (
              reviewsData.reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-xl bg-navy-900/60 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.userId?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80'}
                        alt={rev.userId?.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-xs font-semibold text-white">{rev.userId?.name || 'Viewer'}</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rev.rating}/10</span>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-200">{rev.title}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.content}</p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <button
                      onClick={() => handleLikeReview(rev._id)}
                      className="flex items-center gap-1 hover:text-electric-400 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{rev.likesCount || 0} Likes</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4">No reviews written yet. Be the first to review!</p>
            )}
          </div>
        </section>
      </div>

      <TrailerModal
        trailerKey={movie.trailerKey}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />

      <RatingModal
        tmdbId={movie.tmdbId}
        movieTitle={movie.title}
        initialRating={userRating}
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        onRatingSaved={(r) => setUserRating(r)}
      />

      <WatchlistModal
        movie={movie}
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
      />
    </div>
  );
}
