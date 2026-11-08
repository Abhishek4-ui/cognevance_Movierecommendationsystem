import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, CheckCircle2, PlayCircle, Clock, Loader2, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { watchlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Watchlist() {
  const [watchlists, setWatchlists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, want_to_watch, currently_watching, watched
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWatchlists = async () => {
    try {
      const res = await watchlistApi.getAll();
      const lists = res.data || [];
      setWatchlists(lists);
      if (lists.length > 0 && !activeListId) {
        setActiveListId(lists[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const currentList = watchlists.find(l => l._id === activeListId) || watchlists[0];

  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await watchlistApi.create({ name: newListName.trim() });
      if (res.data?.watchlist) {
        setWatchlists(prev => [res.data.watchlist, ...prev]);
        setActiveListId(res.data.watchlist._id);
        setNewListName('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create watchlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWatchlist = async (id) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await watchlistApi.delete(id);
      const remaining = watchlists.filter(l => l._id !== id);
      setWatchlists(remaining);
      if (remaining.length > 0) setActiveListId(remaining[0]._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete default watchlist.');
    }
  };

  const handleStatusChange = async (tmdbId, newStatus) => {
    try {
      await watchlistApi.updateStatus(activeListId, tmdbId, newStatus);
      setWatchlists(prev => prev.map(l => {
        if (l._id === activeListId) {
          return {
            ...l,
            movies: l.movies.map(m => m.tmdbId === tmdbId ? { ...m, status: newStatus } : m),
          };
        }
        return l;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMovie = async (tmdbId) => {
    try {
      await watchlistApi.removeMovie(activeListId, tmdbId);
      setWatchlists(prev => prev.map(l => {
        if (l._id === activeListId) {
          return {
            ...l,
            movies: l.movies.filter(m => m.tmdbId !== tmdbId),
          };
        }
        return l;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
      </div>
    );
  }

  const filteredMovies = (currentList?.movies || []).filter(m => {
    if (activeTab === 'all') return true;
    return m.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-6 h-6 text-electric-400" />
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Your Movie Collections</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Organize films by status, create custom lists, and synchronize with your recommendation profile.
          </p>
        </div>

        {/* Create new list input */}
        <form onSubmit={handleCreateWatchlist} className="flex gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New collection name..."
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-400"
          />
          <button
            type="submit"
            disabled={creating || !newListName.trim()}
            className="px-4 py-2 glow-button rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Create</span>
          </button>
        </form>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {watchlists.map(list => (
          <div key={list._id} className="flex items-center shrink-0">
            <button
              onClick={() => setActiveListId(list._id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeListId === list._id
                  ? 'bg-electric-500 text-white shadow-lg shadow-electric-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{list.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                {(list.movies || []).length}
              </span>
            </button>
            {!list.isDefault && (
              <button
                onClick={() => handleDeleteWatchlist(list._id)}
                className="p-1.5 ml-1 text-slate-500 hover:text-rose-400 transition"
                title="Delete List"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Status Sub-Filters */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Titles' },
            { id: 'want_to_watch', label: 'Want to Watch' },
            { id: 'currently_watching', label: 'Watching' },
            { id: 'watched', label: 'Watched' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.id ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">{filteredMovies.length} movies listed</span>
      </div>

      {/* Movies Grid / List */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMovies.map(movie => (
            <div key={movie.tmdbId} className="flex flex-col relative group">
              <MovieCard movie={movie} />

              {/* Status and remove controls */}
              <div className="mt-2 flex items-center justify-between px-1">
                <select
                  value={movie.status || 'want_to_watch'}
                  onChange={(e) => handleStatusChange(movie.tmdbId, e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 py-1 px-2 focus:outline-none focus:border-electric-400"
                >
                  <option value="want_to_watch">Want to Watch</option>
                  <option value="currently_watching">Watching</option>
                  <option value="watched">Watched</option>
                </select>

                <button
                  onClick={() => handleRemoveMovie(movie.tmdbId)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  title="Remove from list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-3">
          <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">This collection is currently empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Browse the discovery catalog or ask our AI assistant to recommend titles to add to this collection.
          </p>
          <Link to="/explore" className="inline-block px-5 py-2 glow-button rounded-xl text-xs font-bold text-white">
            Discover Films
          </Link>
        </div>
      )}
    </div>
  );
}
