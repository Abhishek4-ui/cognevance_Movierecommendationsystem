import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Smile, Sparkles, Sliders, Loader2 } from 'lucide-react';
import { recsApi } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function MoodRecommender() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMood, setSelectedMood] = useState(searchParams.get('mood') || 'happy');
  const [minRating, setMinRating] = useState('6.0');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const moods = [
    { id: 'happy', label: 'Happy & Joyful', emoji: '😄', desc: 'Lighthearted, uplifting, feel-good cinema' },
    { id: 'sad', label: 'Melancholic & Reflective', emoji: '😢', desc: 'Emotional dramas and profound catharsis' },
    { id: 'romantic', label: 'Romantic & Passionate', emoji: '💖', desc: 'Love stories, romantic comedies, chemistry' },
    { id: 'excited', label: 'Adrenaline & High Stakes', emoji: '⚡', desc: 'Fast-paced action, twists and thrilling spectacles' },
    { id: 'relaxed', label: 'Cozy & Laid-back', emoji: '☕', desc: 'Comforting, gentle, scenic storytelling' },
    { id: 'motivated', label: 'Inspired & Victorious', emoji: '🏆', desc: 'True grit, triumphant biopics, perseverance' },
    { id: 'scared', label: 'Chilled & Spooked', emoji: '👻', desc: 'Psychological horror, dark suspense, dread' },
    { id: 'curious', label: 'Curious & Mind-Blowing', emoji: '🌌', desc: 'Complex mysteries, cosmic sci-fi, puzzles' },
    { id: 'family_time', label: 'Family Time', emoji: '👨‍👩‍👧‍👦', desc: 'Fun adventures suitable for all generations' },
    { id: 'adventure', label: 'Epic Adventure', emoji: '🗺️', desc: 'Grand journeys, quests, uncharted realms' },
  ];

  useEffect(() => {
    setLoading(true);
    recsApi.getMood(selectedMood, { minRating, limit: 12 })
      .then((res) => {
        setRecommendations(res.data?.results || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMood, minRating]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Smile className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Mood-Based Recommender</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Pick how you're feeling right now, and discover movies matched to your exact mood.
        </p>
      </div>

      {/* Mood Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {moods.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-electric-500/20 border-electric-400 shadow-lg shadow-electric-500/10'
                  : 'bg-navy-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-2xl mb-1.5">{m.emoji}</div>
              <h3 className={`text-xs font-bold ${isSelected ? 'text-electric-300' : 'text-white'}`}>
                {m.label}
              </h3>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Options */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sliders className="w-4 h-4 text-electric-400" />
          <span>Showing matches for "{selectedMood.replace('_', ' ')}" mood</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Minimum Rating:</span>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-electric-400"
          >
            <option value="5.0">★ 5.0+</option>
            <option value="6.0">★ 6.0+</option>
            <option value="7.0">★ 7.0+ (Acclaimed)</option>
            <option value="8.0">★ 8.0+ (Masterpiece)</option>
          </select>
        </div>
      </div>

      {/* Recommendations Output */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {recommendations.map((item) => (
            <MovieCard
              key={item.tmdbId}
              movie={item.movie}
              score={item.score}
              confidence={Math.round(item.score * 100)}
              explanation={item.explanation}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-white">No films found matching this mood and rating threshold.</p>
          <p className="text-xs text-slate-500">Try lowering the minimum rating or connecting TMDB API key.</p>
        </div>
      )}
    </div>
  );
}
