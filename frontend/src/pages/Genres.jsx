import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, ArrowRight, Loader2 } from 'lucide-react';
import { moviesApi } from '../services/api';

export default function Genres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moviesApi.getGenres()
      .then((res) => setGenres(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const genreGradients = [
    'from-rose-500 to-amber-500',
    'from-electric-400 to-accent-indigo',
    'from-purple-500 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-pink-500 to-rose-600',
    'from-amber-400 to-orange-500',
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Genre Collections</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Browse movies curated by your favorite styles, moods, and genres.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {genres.map((g, idx) => {
          const gradient = genreGradients[idx % genreGradients.length];
          return (
            <Link
              key={g.id}
              to={`/explore?genre=${g.id}`}
              className="group p-6 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradient} opacity-15 rounded-full blur-xl group-hover:opacity-30 transition`} />
              <div className="relative space-y-2">
                <Film className="w-6 h-6 text-electric-400 mb-2" />
                <h3 className="text-base font-bold text-white group-hover:text-electric-300 transition">
                  {g.name}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-white transition">
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
