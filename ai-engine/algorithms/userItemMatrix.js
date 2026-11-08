/**
 * User-Item Rating Matrix Builder
 * Transforms database interactions (ratings, watch history, favorites, watchlist)
 * into a sparse matrix representation for collaborative filtering.
 */

export class UserItemMatrix {
  constructor() {
    this.userIds = [];          // Array of unique user IDs
    this.itemIds = [];          // Array of unique movie TMDB IDs
    this.userIndexMap = new Map(); // userId -> matrix row index
    this.itemIndexMap = new Map(); // itemId -> matrix col index
    this.matrix = [];           // 2D Array: matrix[user][item] = rating or null
    this.userMeans = [];        // Average rating per user
    this.itemMeans = [];        // Average rating per item
    this.globalMean = 0;        // Overall average rating
  }

  /**
   * Build matrix from interaction records
   * @param {Array<{ userId: string, tmdbId: number, rating: number, type?: string }>} interactions 
   */
  build(interactions) {
    const userSet = new Set();
    const itemSet = new Set();

    interactions.forEach(entry => {
      userSet.add(entry.userId.toString());
      itemSet.add(Number(entry.tmdbId));
    });

    this.userIds = Array.from(userSet);
    this.itemIds = Array.from(itemSet);

    this.userIndexMap.clear();
    this.userIds.forEach((id, idx) => this.userIndexMap.set(id, idx));

    this.itemIndexMap.clear();
    this.itemIds.forEach((id, idx) => this.itemIndexMap.set(id, idx));

    // Initialize 2D matrix with nulls
    this.matrix = Array.from({ length: this.userIds.length }, () =>
      new Array(this.itemIds.length).fill(null)
    );

    let totalRatingSum = 0;
    let totalRatingCount = 0;

    interactions.forEach(entry => {
      const uIdx = this.userIndexMap.get(entry.userId.toString());
      const iIdx = this.itemIndexMap.get(Number(entry.tmdbId));
      if (uIdx !== undefined && iIdx !== undefined) {
        let ratingValue = Number(entry.rating);
        // Normalize implicit signals if rating is absent
        if (!ratingValue || isNaN(ratingValue)) {
          if (entry.type === 'favorite') ratingValue = 9.0;
          else if (entry.type === 'watched') ratingValue = 8.0;
          else if (entry.type === 'watchlist') ratingValue = 7.0;
          else ratingValue = 6.0;
        }
        ratingValue = Math.max(1, Math.min(10, ratingValue));
        this.matrix[uIdx][iIdx] = ratingValue;
        totalRatingSum += ratingValue;
        totalRatingCount += 1;
      }
    });

    this.globalMean = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 5.0;

    // Compute user means
    this.userMeans = this.matrix.map(row => {
      let sum = 0;
      let count = 0;
      row.forEach(val => {
        if (val !== null) {
          sum += val;
          count++;
        }
      });
      return count > 0 ? sum / count : this.globalMean;
    });

    // Compute item means
    this.itemMeans = new Array(this.itemIds.length).fill(0);
    for (let j = 0; j < this.itemIds.length; j++) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < this.userIds.length; i++) {
        if (this.matrix[i][j] !== null) {
          sum += this.matrix[i][j];
          count++;
        }
      }
      this.itemMeans[j] = count > 0 ? sum / count : this.globalMean;
    }

    return this;
  }

  getRating(userId, itemId) {
    const uIdx = this.userIndexMap.get(userId.toString());
    const iIdx = this.itemIndexMap.get(Number(itemId));
    if (uIdx === undefined || iIdx === undefined) return null;
    return this.matrix[uIdx][iIdx];
  }
}
