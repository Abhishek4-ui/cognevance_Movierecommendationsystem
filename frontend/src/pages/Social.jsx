import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Star, Bookmark, ThumbsUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { socialApi, ratingsReviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Social() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [publicWatchlists, setPublicWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialApi.getFeed()
      .then((res) => {
        setReviews(res.data?.reviews || []);
        setPublicWatchlists(res.data?.publicWatchlists || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLikeReview = async (reviewId) => {
    if (!user) return alert('Please log in to like reviews.');
    try {
      const res = await ratingsReviewsApi.likeReview(reviewId);
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, likesCount: res.data?.likesCount } : r));
    } catch (e) {
      console.error(e);
    }
  };

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
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Community & Social Activity</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Discover discussions, real viewer reviews, and curated public collections from the community.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Reviews & Critical Feed */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-electric-400" />
            <span>Recent Film Reviews</span>
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.userId?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                        alt={rev.userId?.name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{rev.userId?.name || 'Cinephile'}</h4>
                        <p className="text-[10px] text-slate-500">
                          Reviewed <Link to={`/movie/${rev.tmdbId}`} className="text-electric-400 font-semibold hover:underline">{rev.movieTitle}</Link> • {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rev.rating}/10</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{rev.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.content}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <button
                      onClick={() => handleLikeReview(rev._id)}
                      className="flex items-center gap-1.5 hover:text-electric-400 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{rev.likesCount || 0} Likes</span>
                    </button>

                    <Link to={`/movie/${rev.tmdbId}`} className="text-electric-400 hover:text-electric-300 font-semibold text-[11px]">
                      View Movie & Discussions →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 text-xs text-slate-400">
              No community reviews published yet. Be the first to review on any movie page!
            </div>
          )}
        </div>

        {/* Right: Public Watchlists */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-400" />
            <span>Curated Public Lists</span>
          </h2>

          {publicWatchlists.length > 0 ? (
            <div className="space-y-3">
              {publicWatchlists.map(list => (
                <div key={list._id} className="p-4 rounded-xl glass-panel border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white">{list.name}</h3>
                    <span className="text-[10px] text-slate-400">{list.movies?.length || 0} titles</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{list.description || 'Curated member watchlist.'}</p>
                  <p className="text-[10px] text-slate-500">By {list.userId?.name || 'Community Member'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl glass-panel border border-slate-800 text-xs text-slate-500">
              No public lists created yet. You can share your watchlist publicly from the Watchlist manager.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
