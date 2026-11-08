import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoritesApi.getAll()
      .then((res) => setFavorites(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-rose-500 fill-current" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Favorite Films</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Your treasured collection of movies, saved in one beautiful place.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favorites.map((fav) => (
            <MovieCard key={fav.tmdbId} movie={fav} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-3">
          <Heart className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No favorite movies saved yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click the heart icon on any movie to save it to your favorites and sharpen your recommendation profile.
          </p>
          <Link to="/explore" className="inline-block px-5 py-2 glow-button rounded-xl text-xs font-bold text-white">
            Explore Movies
          </Link>
        </div>
      )}
    </div>
  );
}
