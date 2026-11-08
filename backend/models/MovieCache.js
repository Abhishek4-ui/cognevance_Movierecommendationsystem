import mongoose from 'mongoose';

const movieCacheSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    originalTitle: String,
    overview: {
      type: String,
      default: '',
    },
    posterPath: String,
    backdropPath: String,
    releaseDate: String,
    releaseYear: Number,
    runtime: Number,
    voteAverage: {
      type: Number,
      default: 0,
      index: true,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    popularity: {
      type: Number,
      default: 0,
      index: true,
    },
    originalLanguage: {
      type: String,
      default: 'en',
    },
    genres: [
      {
        id: Number,
        name: String,
      },
    ],
    cast: [
      {
        id: Number,
        name: String,
        character: String,
        profilePath: String,
      },
    ],
    directors: [
      {
        id: Number,
        name: String,
      },
    ],
    keywords: [
      {
        id: Number,
        name: String,
      },
    ],
    productionCompanies: [
      {
        id: Number,
        name: String,
      },
    ],
    trailerKey: String,
    streamingProviders: [
      {
        providerId: Number,
        providerName: String,
        logoPath: String,
      },
    ],
    // Processed bag of words representation for fast content-based AI scoring
    featureString: {
      type: String,
      index: true,
    },
    lastFetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

movieCacheSchema.index({ title: 'text', overview: 'text', featureString: 'text' });

export const MovieCache = mongoose.model('MovieCache', movieCacheSchema);
