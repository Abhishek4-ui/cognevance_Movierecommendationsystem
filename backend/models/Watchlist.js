import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ['want_to_watch', 'currently_watching', 'watched'],
      default: 'want_to_watch',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'My Watchlist',
    },
    description: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    movies: [watchlistItemSchema],
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ userId: 1, name: 1 });

export const Watchlist = mongoose.model('Watchlist', watchlistSchema);
