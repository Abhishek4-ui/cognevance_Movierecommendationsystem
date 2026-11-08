import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { moviesApi } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'popularity.desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  useEffect(() => {
    moviesApi.getGenres()
      .then((res) => setGenres(res.data || []))
      .catch(console.error);
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await moviesApi.search({
        query: query.trim() || undefined,
        genreId: selectedGenre || undefined,
        year: selectedYear || undefined,
        minRating: minRating || undefined,
        sortBy,
        page,
      });

      setMovies(res.data?.results || []);
      setTotalPages(Math.min(res.data?.totalPages || 1, 500));
      setTotalResults(res.data?.totalResults || 0);
    } catch (err) {
      console.error('Failed to search movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre, selectedYear, minRating, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMovies();
  };

  const handleClearFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinRating('');
    setSortBy('popularity.desc');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Explore Movies</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Search our comprehensive movie catalog with genres, release years, and critic rating filters.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, director, keywords..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-navy-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-400 transition shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 glow-button text-xs font-bold text-white rounded-xl transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Advanced Filter Controls */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-electric-400" />
            <span>Refine Discover Filters</span>
          </div>
          {(selectedGenre || selectedYear || minRating || query) && (
            <button
              onClick={handleClearFilters}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Genre select */}
          <div>
            <label className="block text-slate-400 mb-1">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-electric-400 focus:outline-none"
            >
              <option value="">All Genres</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-slate-400 mb-1">Release Year</label>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-electric-400 focus:outline-none"
            >
              <option value="">Any Year</option>
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2015, 2010, 2000, 1990].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-slate-400 mb-1">Min Rating</label>
            <select
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-electric-400 focus:outline-none"
            >
              <option value="">Any Rating</option>
              <option value="8.0">★ 8.0+ Masterpiece</option>
              <option value="7.0">★ 7.0+ Great</option>
              <option value="6.0">★ 6.0+ Good</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-electric-400 focus:outline-none"
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Highest Rated</option>
              <option value="primary_release_date.desc">Release Date (Newest)</option>
              <option value="vote_count.desc">Most Voted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing {movies.length} of {totalResults.toLocaleString()} movies</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
          <p className="text-xs text-slate-400">Filtering catalog...</p>
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map(movie => (
            <MovieCard key={movie.tmdbId || movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-slate-300">No movies match your filter criteria.</p>
          <p className="text-xs text-slate-500">Try adjusting your keyword or clearing filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-300">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
