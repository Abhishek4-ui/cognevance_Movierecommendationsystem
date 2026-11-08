import React, { useState, useEffect } from 'react';
import { Flame, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { moviesApi } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Trending() {
  const [movies, setMovies] = useState([]);
  const [window, setWindow] = useState('day');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    moviesApi.getTrending(window, page)
      .then((res) => {
        setMovies(res.data?.results || []);
        setTotalPages(Math.min(res.data?.totalPages || 1, 50));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [window, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-6 h-6 text-rose-500 fill-current" />
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Trending Movies</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            The most popular films people are watching and talking about right now.
          </p>
        </div>

        {/* Day / Week Switch */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => { setWindow('day'); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg transition ${
              window === 'day' ? 'bg-electric-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => { setWindow('week'); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg transition ${
              window === 'week' ? 'bg-electric-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map(movie => (
            <MovieCard key={movie.tmdbId || movie.id} movie={movie} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
