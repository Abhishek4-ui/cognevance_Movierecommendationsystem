import { ContentBasedRecommender } from './recommenders/contentBased.js';
import { CollaborativeRecommender } from './recommenders/collaborative.js';
import { TensorFlowRecommender } from './recommenders/tensorflowModel.js';
import { HybridRecommender } from './recommenders/hybrid.js';
import { TfidfVectorizer } from './algorithms/tfidf.js';
import { cosineSimilarity } from './algorithms/cosineSimilarity.js';
import { UserItemMatrix } from './algorithms/userItemMatrix.js';
import * as metrics from './evaluation/metrics.js';

export {
  ContentBasedRecommender,
  CollaborativeRecommender,
  TensorFlowRecommender,
  HybridRecommender,
  TfidfVectorizer,
  cosineSimilarity,
  UserItemMatrix,
  metrics,
};

export class RecommendationPipeline {
  constructor() {
    this.contentEngine = new ContentBasedRecommender();
    this.collaborativeEngine = new CollaborativeRecommender();
    this.tfEngine = new TensorFlowRecommender();
    this.hybridEngine = new HybridRecommender({
      contentRecommender: this.contentEngine,
      collaborativeRecommender: this.collaborativeEngine,
      tfRecommender: this.tfEngine,
    });
    this.modelVersion = '1.2.0-tfjs-hybrid';
    this.lastTrainedAt = null;
    this.evaluationStats = null;
  }

  async trainPipeline(movies, interactions) {
    console.log(`[AI-Engine] Training Pipeline with ${movies.length} movies and ${interactions.length} interactions...`);

    // 1. Train Content-Based Recommender
    this.contentEngine.train(movies);

    // 2. Train Collaborative Filtering Recommender
    if (interactions.length > 0) {
      this.collaborativeEngine.train(interactions);
    }

    // 3. Train TensorFlow.js Neural Recommender
    let tfStats = null;
    if (interactions.length >= 5) {
      tfStats = await this.tfEngine.train(interactions);
    }

    this.lastTrainedAt = new Date();
    return {
      success: true,
      modelVersion: this.modelVersion,
      moviesCount: movies.length,
      interactionsCount: interactions.length,
      tfTraining: tfStats,
      timestamp: this.lastTrainedAt,
    };
  }

  async getRecommendations(params) {
    return await this.hybridEngine.recommend(params);
  }

  getSimilarMovies(tmdbId, topK = 10) {
    return this.contentEngine.recommendSimilar(tmdbId, topK);
  }
}
