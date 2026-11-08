/**
 * Recommendation System Evaluation Metrics
 * Implements real mathematical formulas for ranking and rating accuracy.
 */

/**
 * Root Mean Squared Error (RMSE)
 * RMSE = sqrt( (1/N) * sum( (y_pred - y_true)^2 ) )
 */
export const calculateRMSE = (predictions, actuals) => {
  if (!predictions || !actuals || predictions.length !== actuals.length || predictions.length === 0) {
    return 0;
  }
  let sumSqErr = 0;
  for (let i = 0; i < predictions.length; i++) {
    const err = predictions[i] - actuals[i];
    sumSqErr += err * err;
  }
  return Math.sqrt(sumSqErr / predictions.length);
};

/**
 * Mean Absolute Error (MAE)
 * MAE = (1/N) * sum( |y_pred - y_true| )
 */
export const calculateMAE = (predictions, actuals) => {
  if (!predictions || !actuals || predictions.length !== actuals.length || predictions.length === 0) {
    return 0;
  }
  let sumAbsErr = 0;
  for (let i = 0; i < predictions.length; i++) {
    sumAbsErr += Math.abs(predictions[i] - actuals[i]);
  }
  return sumAbsErr / predictions.length;
};

/**
 * Precision@K
 * Fraction of recommended items in top-K that are relevant (e.g. rated >= threshold)
 */
export const calculatePrecisionAtK = (recommendedIds, relevantIds, k = 10) => {
  if (!recommendedIds || recommendedIds.length === 0 || !relevantIds || relevantIds.size === 0) {
    return 0;
  }
  const topK = recommendedIds.slice(0, k);
  let relevantCount = 0;
  topK.forEach(id => {
    if (relevantIds.has(Number(id))) relevantCount++;
  });
  return relevantCount / topK.length;
};

/**
 * Recall@K
 * Fraction of all relevant items that are captured in top-K
 */
export const calculateRecallAtK = (recommendedIds, relevantIds, k = 10) => {
  if (!recommendedIds || !relevantIds || relevantIds.size === 0) {
    return 0;
  }
  const topK = recommendedIds.slice(0, k);
  let relevantCount = 0;
  topK.forEach(id => {
    if (relevantIds.has(Number(id))) relevantCount++;
  });
  return relevantCount / relevantIds.size;
};

/**
 * Normalized Discounted Cumulative Gain (NDCG@K)
 * DCG = sum_{i=1}^k (rel_i / log2(i + 1))
 * IDCG = ideal DCG with sorted relevance
 * NDCG = DCG / IDCG
 */
export const calculateNDCGAtK = (recommendedIds, relevanceMap, k = 10) => {
  if (!recommendedIds || recommendedIds.length === 0 || !relevanceMap) {
    return 0;
  }
  const topK = recommendedIds.slice(0, k);

  let dcg = 0;
  topK.forEach((id, i) => {
    const rel = relevanceMap.get(Number(id)) || 0;
    dcg += rel / Math.log2(i + 2); // i=0 -> log2(2) = 1
  });

  const idealRels = Array.from(relevanceMap.values())
    .sort((a, b) => b - a)
    .slice(0, k);

  let idcg = 0;
  idealRels.forEach((rel, i) => {
    idcg += rel / Math.log2(i + 2);
  });

  if (idcg === 0) return 0;
  return dcg / idcg;
};

/**
 * Catalog Coverage
 * Percentage of distinct catalog items recommended across all users
 */
export const calculateCoverage = (allRecommendedIds, totalCatalogCount) => {
  if (!totalCatalogCount || totalCatalogCount === 0) return 0;
  const uniqueRecommended = new Set(allRecommendedIds.map(Number));
  return (uniqueRecommended.size / totalCatalogCount) * 100;
};
