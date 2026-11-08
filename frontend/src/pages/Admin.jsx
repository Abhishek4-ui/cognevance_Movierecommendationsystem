import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Database,
  Brain,
  Key,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { adminApi, recsApi, moviesApi } from '../services/api';
import ApiKeyModal from '../components/ApiKeyModal';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, reportsRes, modelRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getReports(),
        recsApi.getModelStatus(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.stats);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || []);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data || []);
      if (modelRes.status === 'fulfilled') setModelStatus(modelRes.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainMsg(null);
    try {
      const res = await recsApi.trainModel();
      setTrainMsg(res.data?.message || 'AI pipeline trained successfully.');
      const updatedStatus = await recsApi.getModelStatus();
      setModelStatus(updatedStatus.data);
      setTimeout(() => setTrainMsg(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminApi.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('Failed to update role');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
              System Admin & ML Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time system monitoring, database metrics, and user management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Configure TMDB Credentials</span>
          </button>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="px-5 py-2 glow-button rounded-xl text-xs font-bold text-white flex items-center gap-2 transition disabled:opacity-50"
          >
            {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Re-train AI Pipeline</span>
          </button>
        </div>
      </div>

      {trainMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{trainMsg}</span>
        </div>
      )}

      {/* System Status Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Database</span>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{stats?.dbStatus || 'Connected'}</span>
          </div>
          <span className="text-[10px] text-slate-500">{stats?.cachedMovies || 0} movies in cache</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">TMDB API</span>
          <div className="text-lg font-bold text-electric-400 flex items-center gap-2">
            <span>{stats?.tmdbStatus || 'Active'}</span>
          </div>
          <span className="text-[10px] text-slate-500">Live API queries</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">ML Engine</span>
          <div className="text-lg font-bold text-purple-400 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>{modelStatus?.modelVersion || 'v1.2-hybrid'}</span>
          </div>
          <span className="text-[10px] text-slate-500">Indexed Keywords: {modelStatus?.vocabularySize || 0}</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Registered Users</span>
          <div className="text-lg font-bold text-white font-display">
            {stats?.totalUsers || users.length}
          </div>
          <span className="text-[10px] text-slate-500">{stats?.totalReviews || 0} reviews moderated</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-electric-400" />
            <h3 className="text-sm font-bold text-white">Registered Users & Role Control</h3>
          </div>
          <span className="text-xs text-slate-400">{users.length} Total Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Verified</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 flex items-center gap-2 font-medium text-white">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80'}
                      alt={u.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {u.isVerified ? 'Verified' : 'Pending OTP'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-[11px]"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyUpdated={fetchAdminData}
      />
    </div>
  );
}
