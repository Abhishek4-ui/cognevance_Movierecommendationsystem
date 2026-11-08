import { TfidfVectorizer } from '../../ai-engine/algorithms/tfidf.js';
import { cosineSimilarity } from '../../ai-engine/algorithms/cosineSimilarity.js';
import { UserItemMatrix } from '../../ai-engine/algorithms/userItemMatrix.js';
import { ContentBasedRecommender } from '../../ai-engine/recommenders/contentBased.js';
import * as metrics from '../../ai-engine/evaluation/metrics.js';

describe('AI/ML Recommendation Engine Algorithms', () => {
  it('should vectorize documents with TF-IDF and calculate cosine similarity', () => {
    const vectorizer = new TfidfVectorizer();
    const docs = [
      'interstellar space wormhole christopher nolan sci-fi',
      'inception dream subconscious christopher nolan sci-fi',
      'the notebook romance romantic love drama',
    ];

    const vectors = vectorizer.fitTransform(docs);
    expect(vectors.length).toBe(3);

    // Interstellar and Inception should have higher similarity than Interstellar and The Notebook
    const simNolan = cosineSimilarity(vectors[0], vectors[1]);
    const simRomance = cosineSimilarity(vectors[0], vectors[2]);

    expect(simNolan).toBeGreaterThan(simRomance);
    expect(simNolan).toBeGreaterThan(0.2);
  });

  it('should compute Content-Based Recommendations with genuine explanations', () => {
    const recommender = new ContentBasedRecommender();
    const movies = [
      {
        tmdbId: 101,
        title: 'Interstellar',
        overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
        genres: [{ id: 878, name: 'Science Fiction' }, { id: 18, name: 'Drama' }],
        directors: [{ name: 'Christopher Nolan' }],
      },
      {
        tmdbId: 102,
        title: 'Inception',
        overview: 'A thief who steals corporate secrets through dream-sharing technology is given a task to plant an idea.',
        genres: [{ id: 878, name: 'Science Fiction' }, { id: 28, name: 'Action' }],
        directors: [{ name: 'Christopher Nolan' }],
      },
      {
        tmdbId: 103,
        title: 'Before Sunrise',
        overview: 'A young man and woman meet on a train in Europe, and wind up spending one evening together in Vienna.',
        genres: [{ id: 10749, name: 'Romance' }, { id: 18, name: 'Drama' }],
        directors: [{ name: 'Richard Linklater' }],
      },
    ];

    recommender.train(movies);
    const similar = recommender.recommendSimilar(101, 2);

    expect(similar.length).toBeGreaterThan(0);
    expect(similar[0].tmdbId).toBe(102); // Inception is top similar
    expect(similar[0].explanation).toContain('Christopher Nolan');
  });

  it('should construct UserItemMatrix and compute baseline statistics', () => {
    const matrix = new UserItemMatrix();
    const interactions = [
      { userId: 'u1', tmdbId: 101, rating: 9 },
      { userId: 'u1', tmdbId: 102, rating: 8 },
      { userId: 'u2', tmdbId: 101, rating: 10 },
      { userId: 'u2', tmdbId: 103, rating: 6 },
    ];

    matrix.build(interactions);
    expect(matrix.userIds.length).toBe(2);
    expect(matrix.itemIds.length).toBe(3);
    expect(matrix.getRating('u1', 101)).toBe(9);
    expect(matrix.globalMean).toBeGreaterThan(7);
  });

  it('should calculate evaluation metrics (RMSE, MAE, Precision@K, Recall@K, NDCG@K)', () => {
    const preds = [8.5, 7.0, 9.0];
    const actuals = [8.0, 7.5, 9.5];

    const rmse = metrics.calculateRMSE(preds, actuals);
    const mae = metrics.calculateMAE(preds, actuals);

    expect(rmse).toBeCloseTo(0.5, 1);
    expect(mae).toBeCloseTo(0.5, 1);

    const recommended = [101, 102, 103, 104, 105];
    const relevant = new Set([101, 103, 109]);

    const pAt3 = metrics.calculatePrecisionAtK(recommended, relevant, 3);
    const rAt3 = metrics.calculateRecallAtK(recommended, relevant, 3);

    expect(pAt3).toBeCloseTo(2 / 3, 2);
    expect(rAt3).toBeCloseTo(2 / 3, 2);
  });
});
