import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Genre preferences with calculated weights
    genreWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    // Interaction weights
    actorWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    directorWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    likedTmdbIds: [Number],
    dislikedTmdbIds: [Number],
    moodHistory: [
      {
        mood: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
