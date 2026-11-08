import React from 'react';
import { Sparkles, Heart, Github, Database, Cpu, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-800/80 bg-navy-950 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-electric-400 to-accent-purple flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight font-display">
              Cine<span className="text-electric-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Discover your next favorite film. Experience personalized recommendations, trending cinematic releases, mood-based matching, and community reviews.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Curated Cinema</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Real-Time Trends</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Explore & Discover</h4>
          <ul className="space-y-2">
            <li><Link to="/explore" className="hover:text-electric-400 transition">Explore All Movies</Link></li>
            <li><Link to="/trending" className="hover:text-electric-400 transition">Trending Now</Link></li>
            <li><Link to="/top-rated" className="hover:text-electric-400 transition">All-Time Top Rated</Link></li>
            <li><Link to="/mood" className="hover:text-electric-400 transition">Mood Recommender</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Discovery Features</h4>
          <ul className="space-y-2">
            <li><Link to="/ai-assistant" className="hover:text-electric-400 transition">AI Movie Assistant</Link></li>
            <li><Link to="/explore" className="hover:text-electric-400 transition">Personalized Picks</Link></li>
            <li><Link to="/mood" className="hover:text-electric-400 transition">Smart Mood Matcher</Link></li>
            <li><Link to="/trending" className="hover:text-electric-400 transition">Trending Highlights</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">System & Health</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Recommendation Engine Online</span>
            </li>
            <li><Link to="/social" className="hover:text-electric-400 transition">Community Feed</Link></li>
            <li><Link to="/admin" className="hover:text-electric-400 transition">Admin Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© 2026 CineAI. All rights reserved. The modern cinematic discovery platform.</p>
        <p className="flex items-center gap-1">
          Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> for cinematic lovers
        </p>
      </div>
    </footer>
  );
}
