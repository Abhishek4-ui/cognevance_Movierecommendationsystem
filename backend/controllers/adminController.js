import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { Report } from '../models/Report.js';
import { MovieCache } from '../models/MovieCache.js';
import { RecommendationLog } from '../models/RecommendationLog.js';
import { tmdbService } from '../services/tmdbService.js';
import { aiEngineService } from '../services/aiEngineService.js';
import mongoose from 'mongoose';

export const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalReviews, pendingReports, cachedMovies, totalRecLogs] = await Promise.all([
      User.countDocuments(),
      Review.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      MovieCache.countDocuments(),
      RecommendationLog.countDocuments(),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalReviews,
        pendingReports,
        cachedMovies,
        totalRecLogs,
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        tmdbStatus: tmdbService.hasCredentials()
          ? `Connected (${tmdbService.resolveAuthMethod() === 'v4' ? 'v4 Token' : 'v3 Key'})`
          : 'Missing API Key',
        aiPipelineStatus: aiEngineService.isInitialized ? 'Ready' : 'Not trained',
      },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersList = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const getReportsList = async (req, res, next) => {
  try {
    const reports = await Report.find().populate('reporterId', 'name email').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const report = await Report.findByIdAndUpdate(id, { $set: { status, adminNotes } }, { new: true });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
