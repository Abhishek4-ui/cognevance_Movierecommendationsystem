import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { watchlistApi } from '../services/api';

export default function WatchlistModal({ movie, isOpen, onClose }) {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    if (isOpen) {
      watchlistApi.getAll()
        .then((res) => {
          const lists = res.data || [];
          setWatchlists(lists);
          const map = {};
          lists.forEach(l => {
            if ((l.movies || []).some(m => m.tmdbId === (movie?.tmdbId || movie?.id))) {
              map[l._id] = true;
            }
          });
          setAddedMap(map);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, movie]);

  if (!isOpen || !movie) return null;

  const tmdbId = movie.tmdbId || movie.id;

  const handleToggleAdd = async (listId) => {
    const isAdded = addedMap[listId];
    try {
      if (isAdded) {
        await watchlistApi.removeMovie(listId, tmdbId);
        setAddedMap(prev => ({ ...prev, [listId]: false }));
      } else {
        await watchlistApi.addMovie(listId, {
          tmdbId,
          title: movie.title || movie.name,
          posterPath: movie.posterPath || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null),
          voteAverage: movie.voteAverage || movie.vote_average,
          releaseDate: movie.releaseDate || movie.release_date,
          status: 'want_to_watch',
        });
        setAddedMap(prev => ({ ...prev, [listId]: true }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating watchlist');
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await watchlistApi.create({ name: newListName.trim() });
      if (res.data?.watchlist) {
        setWatchlists(prev => [res.data.watchlist, ...prev]);
        setNewListName('');
        // Automatically add movie to the newly created list
        await handleToggleAdd(res.data.watchlist._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create watchlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative border border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">Add to Watchlist</h3>
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">{movie.title || movie.name}</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-electric-400" />
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-4">
            {watchlists.map(list => {
              const inList = addedMap[list._id];
              return (
                <button
                  key={list._id}
                  onClick={() => handleToggleAdd(list._id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                    inList
                      ? 'bg-electric-500/20 border-electric-500/40 text-electric-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-medium">{list.name}</span>
                  {inList ? (
                    <span className="flex items-center gap-1 text-[11px] text-electric-400 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">+ Add</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Create new list input */}
        <form onSubmit={handleCreateList} className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name..."
            className="flex-grow px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-400"
          />
          <button
            type="submit"
            disabled={creating || !newListName.trim()}
            className="px-3.5 py-2 glow-button rounded-xl text-xs font-semibold text-white transition disabled:opacity-50 flex items-center gap-1"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Create</span>
          </button>
        </form>
      </div>
    </div>
  );
}
