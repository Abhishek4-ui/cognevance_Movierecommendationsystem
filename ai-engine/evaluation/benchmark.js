import { RecommendationPipeline } from '../index.js';
import * as metrics from './metrics.js';

async function runBenchmark() {
  console.log('====================================================');
  console.log('AI/ML MOVIE RECOMMENDATION ENGINE - BENCHMARK & EVAL');
  console.log('====================================================');

  // Ground truth dataset of movies
  const sampleMovies = [
    {
      tmdbId: 157336,
      title: 'Interstellar',
      overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
      genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Science Fiction' }],
      directors: [{ name: 'Christopher Nolan' }],
      cast: [{ name: 'Matthew McConaughey' }, { name: 'Anne Hathaway' }, { name: 'Jessica Chastain' }],
      keywords: [{ name: 'black hole' }, { name: 'space' }, { name: 'wormhole' }, { name: 'relativity' }],
      voteAverage: 8.4,
    },
    {
      tmdbId: 27205,
      title: 'Inception',
      overview: 'Cobb, a skilled thief who steals corporate secrets through the use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.',
      genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }],
      directors: [{ name: 'Christopher Nolan' }],
      cast: [{ name: 'Leonardo DiCaprio' }, { name: 'Joseph Gordon-Levitt' }, { name: 'Elliot Page' }],
      keywords: [{ name: 'dream' }, { name: 'subconscious' }, { name: 'heist' }],
      voteAverage: 8.3,
    },
    {
      tmdbId: 155,
      title: 'The Dark Knight',
      overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
      genres: [{ id: 18, name: 'Drama' }, { id: 28, name: 'Action' }, { id: 80, name: 'Crime' }],
      directors: [{ name: 'Christopher Nolan' }],
      cast: [{ name: 'Christian Bale' }, { name: 'Heath Ledger' }, { name: 'Aaron Eckhart' }],
      keywords: [{ name: 'gotham' }, { name: 'joker' }, { name: 'vigilante' }],
      voteAverage: 8.5,
    },
    {
      tmdbId: 680,
      title: 'Pulp Fiction',
      overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in four tales of violence and redemption.',
      genres: [{ id: 53, name: 'Thriller' }, { id: 80, name: 'Crime' }],
      directors: [{ name: 'Quentin Tarantino' }],
      cast: [{ name: 'John Travolta' }, { name: 'Samuel L. Jackson' }, { name: 'Uma Thurman' }],
      keywords: [{ name: 'mob' }, { name: 'hitman' }, { name: 'drugs' }],
      voteAverage: 8.5,
    },
    {
      tmdbId: 13,
      title: 'Forrest Gump',
      overview: 'A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.',
      genres: [{ id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' }, { id: 10749, name: 'Romance' }],
      directors: [{ name: 'Robert Zemeckis' }],
      cast: [{ name: 'Tom Hanks' }, { name: 'Robin Wright' }, { name: 'Gary Sinise' }],
      keywords: [{ name: 'vietnam war' }, { name: 'running' }, { name: 'optimism' }],
      voteAverage: 8.5,
    },
  ];

  // Ground truth user ratings
  const sampleInteractions = [
    { userId: 'user_1', tmdbId: 157336, rating: 9.5 },
    { userId: 'user_1', tmdbId: 27205, rating: 9.0 },
    { userId: 'user_2', tmdbId: 157336, rating: 9.0 },
    { userId: 'user_2', tmdbId: 155, rating: 8.5 },
    { userId: 'user_3', tmdbId: 680, rating: 9.0 },
    { userId: 'user_3', tmdbId: 13, rating: 8.0 },
    { userId: 'user_4', tmdbId: 157336, rating: 9.0 },
    { userId: 'user_4', tmdbId: 27205, rating: 8.5 },
    { userId: 'user_4', tmdbId: 155, rating: 9.0 },
  ];

  const pipeline = new RecommendationPipeline();
  const trainResult = await pipeline.trainPipeline(sampleMovies, sampleInteractions);

  console.log('\nPipeline Training Status:', trainResult);

  // Evaluate Content Similarity
  console.log('\n--- Content Similarity for "Interstellar" (157336) ---');
  const similarToInterstellar = pipeline.getSimilarMovies(157336, 5);
  similarToInterstellar.forEach(r => {
    console.log(`- ${r.movie.title}: Sim Score = ${r.score} | Reason: ${r.explanation}`);
  });

  // Evaluate User Recommendations
  console.log('\n--- Hybrid Recommendations for User 1 ---');
  const user1Recs = await pipeline.getRecommendations({
    userId: 'user_1',
    userInteractions: [{ tmdbId: 157336, rating: 9.5 }, { tmdbId: 27205, rating: 9.0 }],
    excludeIds: [157336, 27205],
    popularCatalog: sampleMovies,
    topK: 3,
  });

  user1Recs.forEach(r => {
    console.log(`- ${r.movie?.title || r.tmdbId}: Score = ${r.score} | Confidence: ${r.confidence}% | Reason: ${r.explanation}`);
  });

  // Calculate Evaluation Metrics
  const groundTruthRelevant = new Set([155]); // User 1 likes Nolan/Sci-Fi/Action, Dark Knight is relevant
  const recIds = user1Recs.map(r => r.tmdbId);
  const precision = metrics.calculatePrecisionAtK(recIds, groundTruthRelevant, 3);
  const recall = metrics.calculateRecallAtK(recIds, groundTruthRelevant, 3);
  const ndcg = metrics.calculateNDCGAtK(recIds, new Map([[155, 3]]), 3);

  // Rating prediction metrics
  const predRating = pipeline.collaborativeEngine.predictRating('user_1', 155);
  const rmse = metrics.calculateRMSE([predRating], [8.5]);
  const mae = metrics.calculateMAE([predRating], [8.5]);

  console.log('\n--- Evaluation Metrics Report ---');
  console.log(`Precision@3: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall@3:    ${(recall * 100).toFixed(1)}%`);
  console.log(`NDCG@3:      ${ndcg.toFixed(3)}`);
  console.log(`Collab RMSE: ${rmse.toFixed(3)}`);
  console.log(`Collab MAE:  ${mae.toFixed(3)}`);
  console.log('====================================================\n');
}

runBenchmark().catch(console.error);
