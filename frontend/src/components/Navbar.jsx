import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Film,
  Sparkles,
  Compass,
  Flame,
  Award,
  Smile,
  Bookmark,
  Users,
  LayoutDashboard,
  Shield,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { moviesApi } from '../services/api';
import ApiKeyModal from './ApiKeyModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  const checkStatus = () => {
    moviesApi.getStatus()
      .then((res) => setHasApiKey(Boolean(res.data?.hasApiKey)))
      .catch(() => setHasApiKey(false));
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Film },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/trending', label: 'Trending', icon: Flame },
    { to: '/top-rated', label: 'Top Rated', icon: Award },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { to: '/mood', label: 'Moods', icon: Smile },
    { to: '/social', label: 'Social', icon: Users },
    ...(user ? [
      { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-40 glass-nav h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-400 via-accent-indigo to-accent-purple flex items-center justify-center text-white shadow-lg shadow-electric-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white font-display flex items-center gap-1">
                Cine<span className="text-electric-400">AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold -mt-1">
                Cinema &amp; Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 relative ${
                    isActive
                      ? 'text-white bg-slate-800/80 font-semibold shadow-inner'
                      : 'hover:text-white hover:bg-slate-800/40'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1 py-0.2 bg-gradient-to-r from-electric-500 to-accent-purple text-white rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Section: API Status, Auth / Profile */}
          <div className="flex items-center gap-2.5">
            {/* TMDB API Key status pill */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                hasApiKey
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/70'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-950/70 animate-pulse'
              }`}
              title="TMDB API Connection Status"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasApiKey ? 'TMDB Active' : 'Configure TMDB'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                  />
                  <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 glow-button text-xs font-bold text-white rounded-xl transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass-panel border-b border-slate-800 p-4 space-y-2 animate-fade-in">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsKeyModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-amber-300 hover:bg-slate-800"
            >
              <Key className="w-4 h-4" />
              <span>Configure TMDB Credentials</span>
            </button>
          </div>
        )}
      </nav>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyUpdated={checkStatus}
      />
    </>
  );
}
