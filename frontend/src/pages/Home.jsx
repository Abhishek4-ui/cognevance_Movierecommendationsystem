import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, Award, Play, Info, ArrowRight, Brain, Zap, Smile } from 'lucide-react';
import { moviesApi, recsApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [heroMovie, setHeroMovie] = useState(null);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, topRes, recsRes] = await Promise.allSettled([
          moviesApi.getTrending('day', 1),
          moviesApi.getTopRated(1),
          recsApi.getPersonalized(8),
        ]);

        if (trendRes.status === 'fulfilled' && trendRes.value.data?.results) {
          const list = trendRes.value.data.results;
          setTrending(list);
          if (list.length > 0) {
            setHeroMovie(list[0]);
          }
        }

        if (topRes.status === 'fulfilled' && topRes.value.data?.results) {
          setTopRated(topRes.value.data.results);
        }

        if (recsRes.status === 'fulfilled' && recsRes.value.data?.recommendations) {
          setPersonalized(recsRes.value.data.recommendations);
        }
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const openTrailer = async (movie) => {
    if (!movie) return;
    try {
      const details = await moviesApi.getDetails(movie.tmdbId || movie.id);
      if (details.data?.trailerKey) {
        setTrailerKey(details.data.trailerKey);
        setIsTrailerOpen(true);
      } else {
        alert('Official trailer currently unavailable for this title.');
      }
    } catch (e) {
      alert('Could not fetch trailer.');
    }
  };

  const moodShortcuts = [
    { mood: 'excited', label: 'High Octane Action', emoji: '⚡', color: 'from-amber-500 to-rose-600' },
    { mood: 'happy', label: 'Feel-Good & Uplifting', emoji: '✨', color: 'from-emerald-400 to-teal-600' },
    { mood: 'romantic', label: 'Heartfelt Romance', emoji: '💖', color: 'from-pink-500 to-rose-500' },
    { mood: 'curious', label: 'Mind-Bending Sci-Fi', emoji: '🌌', color: 'from-electric-400 to-accent-indigo' },
    { mood: 'scared', label: 'Late-Night Chills', emoji: '👻', color: 'from-purple-600 to-indigo-900' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Cinematic Section */}
      {heroMovie && (
        <section className="relative w-full h-[70vh] min-h-[500px] max-h-[750px] overflow-hidden flex items-end">
          {heroMovie.backdropPath && (
            <img
              src={heroMovie.backdropPath}
              alt={heroMovie.title}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-35 scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/40 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 pb-12 w-full space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/20 border border-electric-400/30 text-electric-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-electric-400" />
              <span>Trending Spotlight of the Day</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight max-w-3xl leading-tight">
              {heroMovie.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl line-clamp-3 leading-relaxed">
              {heroMovie.overview}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => openTrailer(heroMovie)}
                className="px-6 py-3 glow-button text-xs sm:text-sm font-bold text-white rounded-xl flex items-center gap-2 transition hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Trailer</span>
              </button>

              <Link
                to={`/movie/${heroMovie.tmdbId || heroMovie.id}`}
                className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs sm:text-sm font-semibold text-white flex items-center gap-2 backdrop-blur-md transition"
              >
                <Info className="w-4 h-4 text-slate-300" />
                <span>View Details & Reviews</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendation Engine Spotlight Row */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-electric-500/20 text-electric-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
                {user ? 'Recommended For You' : 'Top Picks For You'}
              </h2>
              <p className="text-xs text-slate-400">
                Curated based on your favorite genres, themes, and viewing taste
              </p>
            </div>
          </div>

          <Link to="/ai-assistant" className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center gap-1 transition">
            <span>Ask AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {personalized.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {personalized.slice(0, 4).map((rec) => (
              <MovieCard
                key={rec.tmdbId}
                movie={rec.movie || { tmdbId: rec.tmdbId, title: `Movie #${rec.tmdbId}` }}
                score={rec.score}
                confidence={rec.confidence}
                explanation={rec.explanation}
                sources={rec.sources}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-electric-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-white">Personalize Your Recommendations</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Rate or favorite a few movies to help CineAI tailor recommendations specifically to your taste profile.
            </p>
            <Link to="/explore" className="inline-block px-5 py-2 glow-button rounded-xl text-xs font-bold text-white">
              Explore & Rate Movies
            </Link>
          </div>
        )}
      </section>

      {/* Mood Picker Row */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-display">How are you feeling today?</h2>
          </div>
          <Link to="/mood" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <span>All Moods</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {moodShortcuts.map((item) => (
            <Link
              key={item.mood}
              to={`/mood?mood=${item.mood}`}
              className="group relative p-4 rounded-2xl overflow-hidden border border-slate-800/80 hover:border-slate-700 bg-navy-900/60 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${item.color} opacity-15 rounded-full blur-xl group-hover:opacity-30 transition`} />
              <span className="text-2xl mb-2 block">{item.emoji}</span>
              <span className="text-xs font-bold text-white group-hover:text-electric-400 transition block">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{item.mood} vibes</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Movies Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-500 fill-current" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Trending Movies</h2>
          </div>
          <Link to="/trending" className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {trending.slice(0, 10).map((movie) => (
            <MovieCard key={movie.tmdbId || movie.id} movie={movie} />
          ))}
        </div>
      </section>

      {/* All-Time Top Rated Masterpieces */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Critically Acclaimed Masterpieces</h2>
          </div>
          <Link to="/top-rated" className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {topRated.slice(0, 10).map((movie) => (
            <MovieCard key={movie.tmdbId || movie.id} movie={movie} />
          ))}
        </div>
      </section>

      <TrailerModal
        trailerKey={trailerKey}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />
    </div>
  );
}
