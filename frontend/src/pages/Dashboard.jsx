import React, { useState, useEffect } from 'react';
import {
  Film,
  Bookmark,
  Heart,
  Star,
  Clock,
  TrendingUp,
  Brain,
  Calendar,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getAnalytics()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
        <p className="text-xs text-slate-400">Loading your personal movie dashboard...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalWatched: 0,
    totalFavorites: 0,
    totalWatchlist: 0,
    totalRatings: 0,
    averageRating: 0,
  };

  const statCards = [
    { label: 'Movies Watched', value: summary.totalWatched, icon: Film, color: 'text-electric-400', bg: 'bg-electric-500/10' },
    { label: 'In Watchlist', value: summary.totalWatchlist, icon: Bookmark, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Favorites', value: summary.totalFavorites, icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Avg Rating Given', value: `${summary.averageRating}/10`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
            Welcome back, {user?.name || 'Cinephile'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Your personalized viewing trends, favorite genres, and cinema statistics.
          </p>
        </div>

        <Link
          to="/ai-assistant"
          className="px-4 py-2 glow-button rounded-xl text-xs font-bold text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <Brain className="w-4 h-4" />
          <span>Chat with Movie Assistant</span>
        </Link>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-display">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Activity Area Chart */}
        <div className="lg:col-span-8 p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-electric-400" />
              <h3 className="text-sm font-bold text-white">Monthly Watch Activity</h3>
            </div>
            <span className="text-[11px] text-slate-400">Last 6 Months</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyActivity || []}>
                <defs>
                  <linearGradient id="colorWatched" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="moviesWatched" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorWatched)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating Distribution Histogram */}
        <div className="lg:col-span-4 p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Your Rating Breakdown</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.ratingDistribution || []}>
                <XAxis dataKey="score" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Genres & Recent History Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Favorite Genres Pie */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Your Favorite Genres</h3>
          </div>

          {data?.favoriteGenres && data.favoriteGenres.length > 0 ? (
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.favoriteGenres}
                    dataKey="count"
                    nameKey="genre"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {data.favoriteGenres.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">
              Rate or favorite movies to generate genre analytics.
            </div>
          )}
        </div>

        {/* Recently Watched List */}
        <div className="lg:col-span-7 p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Recently Watched Films</h3>
            </div>
            <Link to="/watchlist" className="text-xs font-semibold text-electric-400 hover:text-electric-300">
              Manage Watchlist
            </Link>
          </div>

          {data?.recentHistory && data.recentHistory.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.recentHistory.map((item) => (
                <Link
                  key={item._id}
                  to={`/movie/${item.tmdbId}`}
                  className="group flex gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                    {item.posterPath ? (
                      <img src={item.posterPath} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px]">🎬</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-xs font-semibold text-white group-hover:text-electric-400 transition truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.watchedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No watch history recorded yet. Mark films as watched to populate this section.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
