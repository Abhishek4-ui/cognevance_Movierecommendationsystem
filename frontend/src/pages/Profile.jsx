import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Shield, Key, CheckCircle, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshProfile, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [passError, setPassError] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg(null);
    try {
      await authApi.updateProfile({ name, bio, avatar });
      await refreshProfile();
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPass(true);
    setPassMsg(null);
    setPassError(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPassMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg(null), 3000);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Avatar Card */}
        <div className="md:col-span-4 p-6 rounded-2xl glass-panel border border-slate-800 text-center space-y-4">
          <img
            src={avatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user?.name}
            className="w-24 h-24 rounded-2xl object-cover mx-auto ring-2 ring-electric-500/50 shadow-xl"
          />
          <div>
            <h3 className="text-base font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="capitalize">{user?.role} Tier</span>
          </div>
        </div>

        {/* Right: Edit Profile & Password */}
        <div className="md:col-span-8 space-y-6">
          {/* Edit Profile Form */}
          <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Profile Details</h3>

            {profileMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{profileMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Bio / About</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What kinds of movies move you?"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-5 py-2 glow-button text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5"
              >
                {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-electric-400" />
              <span>Security & Password</span>
            </h3>

            {passMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{passMsg}</span>
              </div>
            )}

            {passError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{passError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={changingPass}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5"
              >
                {changingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
              </button>
            </div>
          </form>

          {/* Danger Zone: Delete Account */}
          <div className="p-6 rounded-2xl glass-panel border border-rose-900/40 bg-rose-950/10 space-y-3">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanently delete your CineAI user account, personal ratings, watch history, watchlist, and personalized ML taste profile. This action cannot be reversed.
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (window.confirm('Are you sure you want to permanently delete your account and all data? This cannot be undone.')) {
                    setDeleting(true);
                    try {
                      await authApi.deleteAccount();
                      await logout();
                      navigate('/signup');
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to delete account');
                      setDeleting(false);
                    }
                  }
                }}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
