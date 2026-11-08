export class HybridRecommender {
  constructor(options = {}) {
    this.contentRecommender = options.contentRecommender;
    this.collaborativeRecommender = options.collaborativeRecommender;
    this.tfRecommender = options.tfRecommender;
  }

  /**
   * Recommend movies for a user using the hybrid pipeline
   * @param {Object} params
   * @param {string} params.userId
   * @param {Array<Object>} params.userInteractions - User's ratings, watch history, favorites
   * @param {Array<number>} params.excludeIds
   * @param {Array<Object>} params.popularCatalog - Fallback catalog for cold-start
   * @param {number} params.topK
   */
  async recommend({
    userId,
    userInteractions = [],
    excludeIds = [],
    popularCatalog = [],
    topK = 10,
  }) {
    const excludeSet = new Set(excludeIds.map(Number));
    userInteractions.forEach(i => excludeSet.add(Number(i.tmdbId)));

    const numInteractions = userInteractions.length;
    const scoreMap = new Map(); // tmdbId -> { score, movie, explanations: Set, sources: Set }

    // CASE 1: True Cold Start (New user with 0 interactions)
    if (numInteractions === 0) {
      return this.handleColdStart(popularCatalog, excludeSet, topK);
    }

    // Determine dynamic weights based on user profile maturity
    let wContent = 0.4;
    let wCollab = 0.4;
    let wTf = 0.2;

    if (numInteractions < 3) {
      // Early profile: lean heavily on content-based metadata
      wContent = 0.75;
      wCollab = 0.15;
      wTf = 0.1;
    }

    // 1. Fetch Content-Based candidates
    let contentCandidates = [];
    if (this.contentRecommender && this.contentRecommender.isTrained) {
      contentCandidates = this.contentRecommender.recommendForUser(userInteractions, Array.from(excludeSet), 30);
      contentCandidates.forEach(item => {
        const id = item.tmdbId;
        const normalizedScore = item.score; // 0..1
        if (!scoreMap.has(id)) {
          scoreMap.set(id, {
            tmdbId: id,
            movie: item.movie,
            contentScore: normalizedScore,
            collabScore: 0,
            tfScore: 0,
            explanations: [item.explanation],
            sources: ['Content-Based Filtering'],
          });
        } else {
          scoreMap.get(id).contentScore = normalizedScore;
          scoreMap.get(id).explanations.push(item.explanation);
          scoreMap.get(id).sources.push('Content-Based Filtering');
        }
      });
    }

    // 2. Fetch Collaborative Filtering candidates
    let collabCandidates = [];
    if (this.collaborativeRecommender) {
      collabCandidates = this.collaborativeRecommender.recommendForUser(userId, 30);
      collabCandidates.forEach(item => {
        const id = item.tmdbId;
        if (excludeSet.has(id)) return;
        const normalizedScore = item.score / 10.0; // 0..1
        if (!scoreMap.has(id)) {
          scoreMap.set(id, {
            tmdbId: id,
            movie: this.contentRecommender?.movieIndex?.get(id) || null,
            contentScore: 0,
            collabScore: normalizedScore,
            tfScore: 0,
            explanations: [item.explanation],
            sources: ['Collaborative Filtering'],
          });
        } else {
          scoreMap.get(id).collabScore = normalizedScore;
          scoreMap.get(id).explanations.push(item.explanation);
          scoreMap.get(id).sources.push('Collaborative Filtering');
        }
      });
    }

    // 3. Fetch TensorFlow.js Neural candidates
    if (this.tfRecommender && this.tfRecommender.isTrained) {
      try {
        const tfCandidates = await this.tfRecommender.recommendForUser(userId, Array.from(excludeSet), 30);
        tfCandidates.forEach(item => {
          const id = item.tmdbId;
          const normalizedScore = item.score / 10.0;
          if (scoreMap.has(id)) {
            scoreMap.get(id).tfScore = normalizedScore;
            scoreMap.get(id).sources.push('TensorFlow.js Neural Embeddings');
          }
        });
      } catch (err) {
        // Safe fallback if TF model is still warming up
      }
    }

    // If candidate pool is too small, backfill with top-rated from popular catalog
    if (scoreMap.size < topK && popularCatalog.length > 0) {
      popularCatalog.forEach(movie => {
        const id = Number(movie.tmdbId || movie.id);
        if (!excludeSet.has(id) && !scoreMap.has(id)) {
          scoreMap.set(id, {
            tmdbId: id,
            movie,
            contentScore: 0.3,
            collabScore: 0.3,
            tfScore: 0.3,
            explanations: ['Top rated movie from our verified catalog'],
            sources: ['Popularity Baseline'],
          });
        }
      });
    }

    // Calculate final weighted hybrid score
    const finalResults = [];
    for (const [id, entry] of scoreMap.entries()) {
      const cScore = entry.contentScore || 0;
      const colScore = entry.collabScore || (cScore > 0 ? cScore * 0.8 : 0.5);
      const tfScore = entry.tfScore || colScore;

      const totalScore = (cScore * wContent) + (colScore * wCollab) + (tfScore * wTf);
      const primaryExplanation = entry.explanations[0] || 'Matches your viewing patterns';

      finalResults.push({
        tmdbId: id,
        movie: entry.movie,
        score: Math.round(totalScore * 100) / 100,
        confidence: Math.min(99, Math.round(totalScore * 100)),
        sources: Array.from(new Set(entry.sources)),
        explanation: primaryExplanation,
        algorithm: 'hybrid',
      });
    }

    finalResults.sort((a, b) => b.score - a.score);
    return finalResults.slice(0, topK);
  }

  /**
   * Cold start handler for brand new users
   */
  handleColdStart(popularCatalog, excludeSet, topK) {
    const fallback = popularCatalog
      .filter(movie => !excludeSet.has(Number(movie.tmdbId || movie.id)))
      .slice(0, topK)
      .map(movie => ({
        tmdbId: Number(movie.tmdbId || movie.id),
        movie,
        score: Math.round((Number(movie.voteAverage || 7.5) / 10) * 100) / 100,
        confidence: 85,
        sources: ['Cold-Start Popularity Baseline'],
        explanation: 'Top-rated critical consensus to start your journey',
        algorithm: 'cold_start',
      }));

    return fallback;
  }
}
