import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp.trim()) return;

    setLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      await verifyOtp(email, otp.trim());
      setStatusMsg('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendOtp({ email });
      setStatusMsg('A fresh verification code has been dispatched.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-slate-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400 mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">Verify Your Email</h1>
          <p className="text-xs text-slate-400">
            Enter the 6-digit verification code sent to <span className="text-electric-300 font-semibold">{email || 'your email'}</span>
          </p>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full text-center text-2xl tracking-widest font-bold px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-electric-300 focus:outline-none focus:border-electric-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.trim().length < 6}
            className="w-full py-3 glow-button rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Activate'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-slate-400 hover:text-electric-400 transition"
          >
            {resending ? 'Sending...' : "Didn't receive code? Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
