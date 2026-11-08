import { aiEngineService } from '../services/aiEngineService.js';
import { RecommendationLog } from '../models/RecommendationLog.js';

export const getPersonalized = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const topK = parseInt(req.query.limit || '12', 10);

    const recs = await aiEngineService.getPersonalizedRecommendations(userId, topK);
    res.json({
      success: true,
      count: recs.length,
      recommendations: recs,
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilar = async (req, res, next) => {
  try {
    const tmdbId = parseInt(req.params.id, 10);
    const topK = parseInt(req.query.limit || '10', 10);

    const similar = await aiEngineService.getSimilarMovies(tmdbId, topK);
    res.json({
      success: true,
      movieId: tmdbId,
      count: similar.length,
      similar,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodRecommendations = async (req, res, next) => {
  try {
    const { mood, genreId, minRating, limit } = req.query;
    const topK = parseInt(limit || '10', 10);

    const results = await aiEngineService.getMoodRecommendations(mood, {
      genreId,
      minRating: minRating ? parseFloat(minRating) : 6.0,
      topK,
    });

    res.json({
      success: true,
      mood: mood || 'happy',
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

export const getModelStatus = async (req, res) => {
  const pipeline = aiEngineService.pipeline;
  res.json({
    success: true,
    modelVersion: pipeline?.modelVersion || '1.2.0-hybrid',
    isInitialized: aiEngineService.isInitialized,
    isTraining: aiEngineService.isTraining,
    lastTrainedAt: pipeline?.lastTrainedAt || null,
    tfLossHistory: pipeline?.tfEngine?.trainingLossHistory || [],
    vocabularySize: pipeline?.contentEngine?.vectorizer?.vocabulary?.size || 0,
    indexedMoviesCount: pipeline?.contentEngine?.movieIndex?.size || 0,
    collaborativeUsersCount: pipeline?.collaborativeEngine?.matrixHelper?.userIds?.length || 0,
    collaborativeItemsCount: pipeline?.collaborativeEngine?.matrixHelper?.itemIds?.length || 0,
  });
};

export const trainModel = async (req, res, next) => {
  try {
    const result = await aiEngineService.syncAndTrain();
    res.json({
      success: true,
      message: 'AI recommendation pipeline successfully retrained.',
      result,
    });
  } catch (error) {
    next(error);
  }
};
