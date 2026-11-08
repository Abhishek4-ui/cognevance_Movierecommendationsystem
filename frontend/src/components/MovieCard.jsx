import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Bookmark, Sparkles, Check } from 'lucide-react';
import { favoritesApi, watchlistApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MovieCard({ movie, score, confidence, explanation, sources }) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!movie) return null;

  const tmdbId = movie.tmdbId || movie.id;
  const title = movie.title || movie.name || 'Untitled';
  const poster = movie.posterPath || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null);
  const rating = movie.voteAverage || movie.vote_average || 0;
  const year = movie.releaseYear || (movie.releaseDate ? movie.releaseDate.split('-')[0] : (movie.release_date ? movie.release_date.split('-')[0] : ''));

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please log in to add movies to your favorites.');
      return;
    }

    setLoadingAction(true);
    try {
      const res = await favoritesApi.toggle({
        tmdbId,
        title,
        posterPath: poster,
        voteAverage: rating,
        releaseDate: movie.releaseDate || movie.release_date,
      });
      setIsFav(res.data?.isFavorite);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleQuickWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please log in to manage your watchlist.');
      return;
    }

    setLoadingAction(true);
    try {
      const watchlistsRes = await watchlistApi.getAll();
      const defaultList = watchlistsRes.data?.[0];
      if (defaultList) {
        await watchlistApi.addMovie(defaultList._id, {
          tmdbId,
          title,
          posterPath: poster,
          voteAverage: rating,
          releaseDate: movie.releaseDate || movie.release_date,
          status: 'want_to_watch',
        });
        setIsWatchlisted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-navy-900/60 border border-slate-800/80 hover:border-slate-700 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-electric-500/10 flex flex-col h-full">
      <Link to={`/movie/${tmdbId}`} className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 block">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-slate-500">
            <span className="text-3xl mb-2">🎬</span>
            <span className="text-xs font-medium line-clamp-2">{title}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-black/30 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
          </div>

          {confidence && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-electric-500/80 backdrop-blur-md text-white text-[10px] font-bold shadow-lg">
              <Sparkles className="w-3 h-3" />
              <span>{confidence}% Match</span>
            </div>
          )}
        </div>

        {/* Quick action overlay buttons */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleFavoriteClick}
            disabled={loadingAction}
            title="Toggle Favorite"
            className={`p-2 rounded-xl backdrop-blur-md border text-xs transition ${
              isFav
                ? 'bg-rose-500/80 border-rose-400 text-white'
                : 'bg-black/60 border-white/20 text-slate-200 hover:text-rose-400 hover:bg-black/80'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleQuickWatchlist}
            disabled={loadingAction || isWatchlisted}
            title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
            className={`p-2 rounded-xl backdrop-blur-md border text-xs transition ${
              isWatchlisted
                ? 'bg-electric-500/80 border-electric-400 text-white'
                : 'bg-black/60 border-white/20 text-slate-200 hover:text-electric-400 hover:bg-black/80'
            }`}
          >
            {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </Link>

      <div className="p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <Link to={`/movie/${tmdbId}`} className="block">
            <h4 className="text-sm font-semibold text-white group-hover:text-electric-400 transition-colors line-clamp-1">
              {title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            {year && <span>{year}</span>}
            {movie.genres?.[0] && (
              <>
                <span>•</span>
                <span className="line-clamp-1">{typeof movie.genres[0] === 'string' ? movie.genres[0] : movie.genres[0]?.name}</span>
              </>
            )}
          </div>
        </div>

        {explanation && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <p className="text-[11px] text-electric-300/90 leading-tight line-clamp-2">
              <span className="font-semibold text-slate-400">Why: </span>{explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
