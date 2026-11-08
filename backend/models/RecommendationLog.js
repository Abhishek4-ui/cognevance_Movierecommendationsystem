import mongoose from 'mongoose';

const recommendationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    algorithm: {
      type: String,
      enum: ['content_based', 'collaborative', 'hybrid', 'tensorflow', 'mood', 'cold_start'],
      required: true,
    },
    inputContext: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recommendations: [
      {
        tmdbId: Number,
        title: String,
        score: Number,
        explanation: String,
      },
    ],
    executionTimeMs: Number,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RecommendationLog = mongoose.model('RecommendationLog', recommendationLogSchema);
