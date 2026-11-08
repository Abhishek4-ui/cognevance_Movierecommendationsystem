import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { ratingsReviewsApi } from '../services/api';

export default function RatingModal({ tmdbId, movieTitle, initialRating, isOpen, onClose, onRatingSaved }) {
  const [rating, setRating] = useState(initialRating || 8);
  const [hoverRating, setHoverRating] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await ratingsReviewsApi.rate({ tmdbId, rating });
      if (onRatingSaved) onRatingSaved(rating);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-sm p-6 rounded-2xl relative border border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">Rate Movie</h3>
        <p className="text-xs text-slate-400 mb-6 line-clamp-1">{movieTitle}</p>

        <div className="flex justify-center items-center gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const active = (hoverRating || rating) >= num;
            return (
              <button
                key={num}
                type="button"
                onMouseEnter={() => setHoverRating(num)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(num)}
                className="p-1 focus:outline-none transition-transform hover:scale-125"
              >
                <Star
                  className={`w-6 h-6 ${
                    active ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="text-center font-bold text-2xl text-amber-400 mb-6">
          {hoverRating || rating} <span className="text-sm text-slate-500 font-normal">/ 10</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 glow-button rounded-xl font-semibold text-xs text-white transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rating'}
        </button>
      </div>
    </div>
  );
}
