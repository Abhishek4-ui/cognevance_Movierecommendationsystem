import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
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
    },
    title: {
      type: String,
      required: true,
    },
    posterPath: String,
    backdropPath: String,
    voteAverage: Number,
    releaseDate: String,
    genres: [String],
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
