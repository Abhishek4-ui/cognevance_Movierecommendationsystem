/**
 * Cosine Similarity algorithms for Vector and Matrix comparisons
 */

/**
 * Compute cosine similarity between two numeric vectors
 * @param {Float64Array|number[]} a 
 * @param {Float64Array|number[]} b 
 * @returns {number} Score between -1 and 1 (typically 0 to 1 for TF-IDF)
 */
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const score = dotProduct / denominator;
  // Guard against float precision drift
  return Math.max(0, Math.min(1, score));
};

/**
 * Fast dot product for already L2-normalized vectors
 * @param {Float64Array} a 
 * @param {Float64Array} b 
 * @returns {number}
 */
export const normalizedDotProduct = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
};

/**
 * Find top K most similar vectors to targetVector from a pool of candidate vectors
 * @param {Float64Array} targetVector 
 * @param {Array<{ id: any, vector: Float64Array }>} candidates 
 * @param {number} topK 
 * @returns {Array<{ id: any, similarity: number }>}
 */
export const findTopKSimilar = (targetVector, candidates, topK = 10) => {
  const scored = candidates.map(candidate => ({
    id: candidate.id,
    similarity: normalizedDotProduct(targetVector, candidate.vector)
  }));

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
};
