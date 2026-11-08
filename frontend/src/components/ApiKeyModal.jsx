import React, { useState, useEffect } from 'react';
import { moviesApi } from '../services/api';
import {
  Key,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  Info,
  Radio,
  Lock,
} from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated }) {
  const [readAccessToken, setReadAccessToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authMethod, setAuthMethod] = useState('v4'); // 'v4' | 'v3'
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentStatus();
      setStatusMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadCurrentStatus = async () => {
    setFetchingStatus(true);
    try {
      const res = await moviesApi.getStatus();
      setCurrentStatus(res.data);
      if (res.data?.authMethod) {
        setAuthMethod(res.data.authMethod);
      }
    } catch {
      // Non-blocking status lookup failure
    } finally {
      setFetchingStatus(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanToken = readAccessToken.trim();
    const cleanKey = apiKey.trim();

    if (!cleanToken && !cleanKey) {
      setErrorMsg('Please enter either a TMDB v4 Read Access Token or a TMDB v3 API Key.');
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await moviesApi.updateApiKey({
        readAccessToken: cleanToken,
        apiKey: cleanKey,
        authMethod: authMethod || (cleanToken ? 'v4' : 'v3'),
      });

      const details = res.data?.details;
      const verifiedTitle = details?.testMovie ? ` (Verified with: "${details.testMovie}")` : '';
      setStatusMsg(`${res.data?.message || 'Credentials verified & saved successfully!'}${verifiedTitle}`);

      if (onKeyUpdated) onKeyUpdated();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(serverMsg || 'Failed to authenticate TMDB credentials. Please verify your token or key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-7 rounded-2xl relative border border-slate-700/70 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              TMDB Authentication Setup
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-400">Configure genuine TheMovieDatabase (TMDB) API credentials</p>
          </div>
        </div>

        {/* Live Status Badge */}
        {currentStatus && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentStatus.hasCredentials ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {currentStatus.hasCredentials
                  ? `Active: ${currentStatus.authMethod === 'v4' ? 'v4 Read Access Token' : 'v3 API Key'}`
                  : 'Status: No credentials configured'}
              </span>
            </div>
            {currentStatus.cachedMoviesCount !== undefined && (
              <span className="text-slate-400 text-[11px] font-mono">
                {currentStatus.cachedMoviesCount} cached in DB
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          CineAI supports both TMDB authentication standards. All credentials are verified live against TMDB and safely stored on your server in <code className="text-electric-300 bg-slate-800/80 px-1 py-0.5 rounded text-[11px]">backend/.env</code> without client-side exposure.
        </p>

        {/* Success Alert */}
        {statusMsg && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200 animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">Authentication Verified</p>
              <p className="text-[11px] text-emerald-200/90">{statusMsg}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Authentication Failed</p>
              <p className="text-[11px] text-rose-200/90">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Preferred Authentication Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMethod('v4')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  authMethod === 'v4'
                    ? 'bg-electric-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>v4 Access Token</span>
                <span className="text-[9px] uppercase px-1 py-0.2 bg-white/20 rounded font-mono">Preferred</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('v3')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  authMethod === 'v3'
                    ? 'bg-electric-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>v3 API Key</span>
                <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">Legacy</span>
              </button>
            </div>
          </div>

          {/* Field 1: v4 Read Access Token */}
          <div className={`p-3 rounded-xl border transition ${
            authMethod === 'v4' ? 'bg-slate-900/80 border-electric-500/50' : 'bg-slate-900/40 border-slate-800/80 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-200">
                1. TMDB API Read Access Token (v4)
              </label>
              <span className="text-[10px] text-electric-400 font-mono">Authorization: Bearer</span>
            </div>
            <textarea
              rows={2}
              value={readAccessToken}
              onChange={(e) => setReadAccessToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOi..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-electric-400 resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Recommended by TMDB. Found under TMDB Account &gt; Settings &gt; API &gt; "API Read Access Token (v4)".
            </p>
          </div>

          {/* Field 2: v3 API Key */}
          <div className={`p-3 rounded-xl border transition ${
            authMethod === 'v3' ? 'bg-slate-900/80 border-electric-500/50' : 'bg-slate-900/40 border-slate-800/80 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-200">
                2. TMDB API Key (v3 auth)
              </label>
              <span className="text-[10px] text-amber-400 font-mono">?api_key=</span>
            </div>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. a2f022c808031b695ead540577b6bd91"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-electric-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Standard 32-character hexadecimal key found under "API Key (v3 auth)".
            </p>
          </div>

          {/* External Link Helper */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-electric-400 hover:text-electric-300 underline font-medium"
            >
              <span>Get or verify your TMDB credentials</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Direct proxy security
            </span>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!readAccessToken.trim() && !apiKey.trim())}
              className="px-5 py-2.5 glow-button text-xs font-semibold text-white rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating with TMDB...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validate &amp; Save Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
