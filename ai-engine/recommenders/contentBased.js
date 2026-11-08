import { TfidfVectorizer } from '../algorithms/tfidf.js';
import { normalizedDotProduct } from '../algorithms/cosineSimilarity.js';
import { createMovieFeatureSoup } from '../preprocessing/textProcessor.js';

export class ContentBasedRecommender {
  constructor() {
    this.vectorizer = new TfidfVectorizer({ maxFeatures: 4000, minDf: 1 });
    this.movieVectors = new Map(); // tmdbId -> Float64Array
    this.movieIndex = new Map();   // tmdbId -> movie metadata
    this.isTrained = false;
  }

  /**
   * Train/fit the content-based engine on an array of movie objects
   * @param {Array<Object>} movies 
   */
  train(movies) {
    if (!movies || movies.length === 0) return this;

    this.movieIndex.clear();
    this.movieVectors.clear();

    const soups = [];
    const validMovies = [];

    movies.forEach(movie => {
      const soup = createMovieFeatureSoup(movie);
      if (soup.trim().length > 0) {
        soups.push(soup);
        validMovies.push(movie);
      }
    });

    const vectors = this.vectorizer.fitTransform(soups);

    validMovies.forEach((movie, idx) => {
      this.movieIndex.set(Number(movie.tmdbId), movie);
      this.movieVectors.set(Number(movie.tmdbId), vectors[idx]);
    });

    this.isTrained = true;
    return this;
  }

  /**
   * Recommend movies similar to a given movie
   * @param {number} tmdbId 
   * @param {number} topK 
   * @returns {Array<Object>}
   */
  recommendSimilar(tmdbId, topK = 10) {
    const targetId = Number(tmdbId);
    const targetVector = this.movieVectors.get(targetId);
    const targetMovie = this.movieIndex.get(targetId);

    if (!targetVector || !targetMovie) {
      return [];
    }

    const results = [];

    for (const [candidateId, candidateVec] of this.movieVectors.entries()) {
      if (candidateId === targetId) continue;

      const simScore = normalizedDotProduct(targetVector, candidateVec);
      if (simScore > 0.05) {
        const candidateMovie = this.movieIndex.get(candidateId);
        const explanation = this.explainSimilarity(targetMovie, candidateMovie, simScore);

        results.push({
          tmdbId: candidateId,
          movie: candidateMovie,
          score: Math.round(simScore * 1000) / 1000,
          explanation,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Recommend movies for a user based on their history of liked/rated movies
   * @param {Array<{ tmdbId: number, rating: number }>} userInteractions 
   * @param {Array<number>} excludeIds 
   * @param {number} topK 
   * @returns {Array<Object>}
   */
  recommendForUser(userInteractions, excludeIds = [], topK = 10) {
    if (!this.isTrained || userInteractions.length === 0) {
      return [];
    }

    const excludeSet = new Set(excludeIds.map(Number));
    userInteractions.forEach(i => excludeSet.add(Number(i.tmdbId)));

    // Create user profile vector by weighted sum of their liked movies
    const vocabSize = this.vectorizer.vocabulary.size;
    const userProfileVector = new Float64Array(vocabSize);
    let totalWeight = 0;

    userInteractions.forEach(({ tmdbId, rating }) => {
      const vec = this.movieVectors.get(Number(tmdbId));
      if (vec) {
        // Ratings above 5 are positive, normalize to weight between 0.2 and 2.0
        const weight = Math.max(0.1, (Number(rating) - 4) / 3);
        for (let i = 0; i < vocabSize; i++) {
          userProfileVector[i] += vec[i] * weight;
        }
        totalWeight += weight;
      }
    });

    if (totalWeight === 0) return [];

    // Normalize user profile vector
    let normSq = 0;
    for (let i = 0; i < vocabSize; i++) {
      normSq += userProfileVector[i] * userProfileVector[i];
    }
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < vocabSize; i++) {
        userProfileVector[i] /= norm;
      }
    }

    const recommendations = [];

    for (const [candidateId, candidateVec] of this.movieVectors.entries()) {
      if (excludeSet.has(candidateId)) continue;

      const score = normalizedDotProduct(userProfileVector, candidateVec);
      if (score > 0.05) {
        const candidateMovie = this.movieIndex.get(candidateId);
        recommendations.push({
          tmdbId: candidateId,
          movie: candidateMovie,
          score: Math.round(score * 1000) / 1000,
          explanation: this.explainUserProfileMatch(candidateMovie, userInteractions),
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, topK);
  }

  /**
   * Explain why candidate movie is similar to target movie
   */
  explainSimilarity(target, candidate, simScore) {
    if (!target || !candidate) return 'Recommended based on overall thematic similarity';

    const targetGenres = new Set((target.genres || []).map(g => (typeof g === 'string' ? g : g.name)));
    const commonGenres = (candidate.genres || [])
      .map(g => (typeof g === 'string' ? g : g.name))
      .filter(g => targetGenres.has(g));

    const targetDirectors = new Set((target.directors || []).map(d => (typeof d === 'string' ? d : d.name)));
    const commonDirectors = (candidate.directors || [])
      .map(d => (typeof d === 'string' ? d : d.name))
      .filter(d => targetDirectors.has(d));

    const targetCast = new Set((target.cast || []).slice(0, 5).map(c => (typeof c === 'string' ? c : c.name)));
    const commonCast = (candidate.cast || [])
      .slice(0, 5)
      .map(c => (typeof c === 'string' ? c : c.name))
      .filter(c => targetCast.has(c));

    if (commonDirectors.length > 0) {
      return `Directed by ${commonDirectors[0]}, who also directed ${target.title}`;
    }
    if (commonCast.length > 0) {
      return `Stars ${commonCast.slice(0, 2).join(' and ')}, who also starred in ${target.title}`;
    }
    if (commonGenres.length > 0) {
      return `Shares genres (${commonGenres.slice(0, 2).join(', ')}) with ${target.title}`;
    }
    return `Thematic and tonal similarity of ${Math.round(simScore * 100)}% with ${target.title}`;
  }

  /**
   * Explain why candidate movie matches user profile
   */
  explainUserProfileMatch(candidate, userInteractions) {
    const candidateGenres = (candidate.genres || []).map(g => (typeof g === 'string' ? g : g.name));
    if (candidateGenres.length > 0) {
      return `Matches your taste in ${candidateGenres.slice(0, 2).join(' & ')} films`;
    }
    return `Recommended based on your recent viewing and rating history`;
  }
}
