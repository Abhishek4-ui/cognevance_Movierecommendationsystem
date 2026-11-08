import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    movieTitle: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One user can only have one rating per movie (prevents duplicate ratings)
ratingSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const Rating = mongoose.model('Rating', ratingSchema);
