import { UserItemMatrix } from '../algorithms/userItemMatrix.js';

export class CollaborativeRecommender {
  constructor() {
    this.matrixHelper = new UserItemMatrix();
    this.userSimilarities = []; // 2D similarity matrix [u1][u2]
    this.itemSimilarities = []; // 2D similarity matrix [i1][i2]
  }

  /**
   * Train collaborative model with interaction list
   * @param {Array<{ userId: string, tmdbId: number, rating: number, type?: string }>} interactions 
   */
  train(interactions) {
    if (!interactions || interactions.length === 0) return this;

    this.matrixHelper.build(interactions);
    const numUsers = this.matrixHelper.userIds.length;
    const numItems = this.matrixHelper.itemIds.length;

    // Compute User-User Pearson correlation matrix
    this.userSimilarities = Array.from({ length: numUsers }, () => new Float64Array(numUsers));
    for (let u1 = 0; u1 < numUsers; u1++) {
      this.userSimilarities[u1][u1] = 1.0;
      for (let u2 = u1 + 1; u2 < numUsers; u2++) {
        const sim = this.computeUserSimilarity(u1, u2);
        this.userSimilarities[u1][u2] = sim;
        this.userSimilarities[u2][u1] = sim;
      }
    }

    // Compute Item-Item Adjusted Cosine similarity matrix
    this.itemSimilarities = Array.from({ length: numItems }, () => new Float64Array(numItems));
    for (let i1 = 0; i1 < numItems; i1++) {
      this.itemSimilarities[i1][i1] = 1.0;
      for (let i2 = i1 + 1; i2 < numItems; i2++) {
        const sim = this.computeItemSimilarity(i1, i2);
        this.itemSimilarities[i1][i2] = sim;
        this.itemSimilarities[i2][i1] = sim;
      }
    }

    return this;
  }

  /**
   * Pearson correlation between user u1 and u2
   */
  computeUserSimilarity(u1, u2) {
    const row1 = this.matrixHelper.matrix[u1];
    const row2 = this.matrixHelper.matrix[u2];
    const mean1 = this.matrixHelper.userMeans[u1];
    const mean2 = this.matrixHelper.userMeans[u2];

    let num = 0;
    let den1 = 0;
    let den2 = 0;
    let coRatedCount = 0;

    for (let j = 0; j < row1.length; j++) {
      if (row1[j] !== null && row2[j] !== null) {
        coRatedCount++;
        const diff1 = row1[j] - mean1;
        const diff2 = row2[j] - mean2;
        num += diff1 * diff2;
        den1 += diff1 * diff1;
        den2 += diff2 * diff2;
      }
    }

    // Significance weighting: penalize if few co-rated items
    if (coRatedCount < 2 || den1 === 0 || den2 === 0) return 0;
    const sim = num / (Math.sqrt(den1) * Math.sqrt(den2));
    const shrinkage = Math.min(1, coRatedCount / 5);
    return Math.max(-1, Math.min(1, sim * shrinkage));
  }

  /**
   * Adjusted Cosine similarity between item i1 and item i2
   */
  computeItemSimilarity(i1, i2) {
    let num = 0;
    let den1 = 0;
    let den2 = 0;
    let coUsersCount = 0;

    for (let u = 0; u < this.matrixHelper.userIds.length; u++) {
      const r1 = this.matrixHelper.matrix[u][i1];
      const r2 = this.matrixHelper.matrix[u][i2];
      if (r1 !== null && r2 !== null) {
        coUsersCount++;
        const uMean = this.matrixHelper.userMeans[u];
        const diff1 = r1 - uMean;
        const diff2 = r2 - uMean;
        num += diff1 * diff2;
        den1 += diff1 * diff1;
        den2 += diff2 * diff2;
      }
    }

    if (coUsersCount === 0 || den1 === 0 || den2 === 0) return 0;
    const sim = num / (Math.sqrt(den1) * Math.sqrt(den2));
    return Math.max(0, Math.min(1, sim));
  }

  /**
   * Predict rating of user for item using K-Nearest Neighbors
   */
  predictRating(userId, itemId, k = 10) {
    const uIdx = this.matrixHelper.userIndexMap.get(userId.toString());
    const iIdx = this.matrixHelper.itemIndexMap.get(Number(itemId));

    if (uIdx === undefined || iIdx === undefined) {
      return this.matrixHelper.globalMean;
    }

    // Already rated?
    if (this.matrixHelper.matrix[uIdx][iIdx] !== null) {
      return this.matrixHelper.matrix[uIdx][iIdx];
    }

    const uMean = this.matrixHelper.userMeans[uIdx];

    // Find top-k most similar users who rated this item
    const neighbors = [];
    for (let otherUser = 0; otherUser < this.matrixHelper.userIds.length; otherUser++) {
      if (otherUser === uIdx) continue;
      const otherRating = this.matrixHelper.matrix[otherUser][iIdx];
      const sim = this.userSimilarities[uIdx][otherUser];
      if (otherRating !== null && sim > 0) {
        neighbors.push({ sim, diff: otherRating - this.matrixHelper.userMeans[otherUser] });
      }
    }

    neighbors.sort((a, b) => b.sim - a.sim);
    const topK = neighbors.slice(0, k);

    if (topK.length === 0) {
      return this.matrixHelper.itemMeans[iIdx] || uMean;
    }

    let weightedSum = 0;
    let totalSim = 0;
    topK.forEach(n => {
      weightedSum += n.sim * n.diff;
      totalSim += Math.abs(n.sim);
    });

    const predicted = uMean + (totalSim > 0 ? weightedSum / totalSim : 0);
    return Math.max(1, Math.min(10, Math.round(predicted * 10) / 10));
  }

  /**
   * Recommend unrated items for user
   */
  recommendForUser(userId, topK = 10) {
    const uIdx = this.matrixHelper.userIndexMap.get(userId.toString());
    if (uIdx === undefined) return [];

    const predictions = [];

    for (let j = 0; j < this.matrixHelper.itemIds.length; j++) {
      if (this.matrixHelper.matrix[uIdx][j] === null) {
        const tmdbId = this.matrixHelper.itemIds[j];
        const predictedRating = this.predictRating(userId, tmdbId);
        if (predictedRating >= 6.0) {
          predictions.push({
            tmdbId,
            score: predictedRating,
            explanation: `Users with similar movie tastes rated this ${predictedRating}/10`,
          });
        }
      }
    }

    predictions.sort((a, b) => b.score - a.score);
    return predictions.slice(0, topK);
  }
}
