import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    posterPath: String,
    backdropPath: String,
    genres: [String],
    rating: Number,
    watchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

watchHistorySchema.index({ userId: 1, tmdbId: 1, watchedAt: -1 });

export const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);
