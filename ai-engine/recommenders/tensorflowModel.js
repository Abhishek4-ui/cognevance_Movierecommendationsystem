import * as tf from '@tensorflow/tfjs';

export class TensorFlowRecommender {
  constructor(options = {}) {
    this.latentDim = options.latentDim || 16;
    this.learningRate = options.learningRate || 0.005;
    this.epochs = options.epochs || 15;
    this.batchSize = options.batchSize || 32;

    this.model = null;
    this.userMap = new Map(); // userId -> integer index
    this.itemMap = new Map(); // itemId -> integer index
    this.reverseItemMap = new Map(); // integer index -> itemId
    this.isTrained = false;
    this.trainingLossHistory = [];
  }

  /**
   * Build the Neural Collaborative Filtering / Deep Matrix Factorization model
   */
  buildModel(numUsers, numItems) {
    const userInput = tf.input({ shape: [1], name: 'userInput', dtype: 'int32' });
    const itemInput = tf.input({ shape: [1], name: 'itemInput', dtype: 'int32' });

    // User Embedding
    const userEmbedding = tf.layers.embedding({
      inputDim: numUsers,
      outputDim: this.latentDim,
      embeddingsInitializer: 'glorotNormal',
      name: 'userEmbedding',
    }).apply(userInput);

    // Item Embedding
    const itemEmbedding = tf.layers.embedding({
      inputDim: numItems,
      outputDim: this.latentDim,
      embeddingsInitializer: 'glorotNormal',
      name: 'itemEmbedding',
    }).apply(itemInput);

    // Flatten embeddings
    const userFlat = tf.layers.flatten().apply(userEmbedding);
    const itemFlat = tf.layers.flatten().apply(itemEmbedding);

    // Concatenate for deep neural ranking layers
    const concat = tf.layers.concatenate().apply([userFlat, itemFlat]);

    const dense1 = tf.layers.dense({
      units: 32,
      activation: 'relu',
    }).apply(concat);

    const dropout = tf.layers.dropout({ rate: 0.2 }).apply(dense1);

    const dense2 = tf.layers.dense({
      units: 16,
      activation: 'relu',
    }).apply(dropout);

    const output = tf.layers.dense({
      units: 1,
      activation: 'linear', // Predict rating score normalized 0 to 1
      name: 'ratingPrediction',
    }).apply(dense2);

    const model = tf.model({
      inputs: [userInput, itemInput],
      outputs: output,
    });

    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse'],
    });

    this.model = model;
    return model;
  }

  /**
   * Train model on user-item interaction pairs
   * @param {Array<{ userId: string, tmdbId: number, rating: number }>} interactions 
   */
  async train(interactions) {
    if (!interactions || interactions.length < 5) {
      return { success: false, reason: 'Insufficient training interactions' };
    }

    this.userMap.clear();
    this.itemMap.clear();
    this.reverseItemMap.clear();

    let uCount = 0;
    let iCount = 0;

    interactions.forEach(entry => {
      const uStr = entry.userId.toString();
      const iNum = Number(entry.tmdbId);
      if (!this.userMap.has(uStr)) {
        this.userMap.set(uStr, uCount++);
      }
      if (!this.itemMap.has(iNum)) {
        this.itemMap.set(iNum, iCount);
        this.reverseItemMap.set(iCount, iNum);
        iCount++;
      }
    });

    this.buildModel(uCount, iCount);

    const userIndices = [];
    const itemIndices = [];
    const ratings = [];

    interactions.forEach(entry => {
      const uIdx = this.userMap.get(entry.userId.toString());
      const iIdx = this.itemMap.get(Number(entry.tmdbId));
      if (uIdx !== undefined && iIdx !== undefined) {
        userIndices.push(uIdx);
        itemIndices.push(iIdx);
        // Normalize 1..10 to 0.1..1.0
        ratings.push(Math.max(1, Math.min(10, Number(entry.rating))) / 10.0);
      }
    });

    const userTensor = tf.tensor2d(userIndices, [userIndices.length, 1], 'int32');
    const itemTensor = tf.tensor2d(itemIndices, [itemIndices.length, 1], 'int32');
    const labelTensor = tf.tensor2d(ratings, [ratings.length, 1], 'float32');

    this.trainingLossHistory = [];

    try {
      const history = await this.model.fit([userTensor, itemTensor], labelTensor, {
        epochs: this.epochs,
        batchSize: Math.min(this.batchSize, userIndices.length),
        shuffle: true,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.trainingLossHistory.push({ epoch: epoch + 1, loss: logs.loss });
          },
        },
      });

      this.isTrained = true;
      return {
        success: true,
        numUsers: uCount,
        numItems: iCount,
        totalSamples: userIndices.length,
        finalLoss: this.trainingLossHistory[this.trainingLossHistory.length - 1]?.loss || 0,
      };
    } finally {
      userTensor.dispose();
      itemTensor.dispose();
      labelTensor.dispose();
    }
  }

  /**
   * Score an item for a given user using the neural model
   * @param {string} userId 
   * @param {number} tmdbId 
   * @returns {Promise<number>} Predicted rating 1 to 10
   */
  async predict(userId, tmdbId) {
    if (!this.isTrained || !this.model) return 6.0;

    const uIdx = this.userMap.get(userId.toString());
    const iIdx = this.itemMap.get(Number(tmdbId));

    if (uIdx === undefined || iIdx === undefined) return 6.0;

    return tf.tidy(() => {
      const uTensor = tf.tensor2d([uIdx], [1, 1], 'int32');
      const iTensor = tf.tensor2d([iIdx], [1, 1], 'int32');
      const prediction = this.model.predict([uTensor, iTensor]);
      const rawScore = prediction.dataSync()[0];
      return Math.max(1, Math.min(10, Math.round(rawScore * 100) / 10));
    });
  }

  /**
   * Generate top K ranked recommendations for a user
   */
  async recommendForUser(userId, excludeIds = [], topK = 10) {
    if (!this.isTrained || !this.model) return [];

    const uIdx = this.userMap.get(userId.toString());
    if (uIdx === undefined) return [];

    const excludeSet = new Set(excludeIds.map(Number));
    const candidateIndices = [];
    const candidateItemIds = [];

    for (let i = 0; i < this.itemMap.size; i++) {
      const tmdbId = this.reverseItemMap.get(i);
      if (!excludeSet.has(tmdbId)) {
        candidateIndices.push(i);
        candidateItemIds.push(tmdbId);
      }
    }

    if (candidateIndices.length === 0) return [];

    const uArray = new Array(candidateIndices.length).fill(uIdx);

    const predictions = tf.tidy(() => {
      const uTensor = tf.tensor2d(uArray, [uArray.length, 1], 'int32');
      const iTensor = tf.tensor2d(candidateIndices, [candidateIndices.length, 1], 'int32');
      const pred = this.model.predict([uTensor, iTensor]);
      return Array.from(pred.dataSync());
    });

    const results = candidateItemIds.map((tmdbId, idx) => ({
      tmdbId,
      score: Math.max(1, Math.min(10, Math.round(predictions[idx] * 100) / 10)),
      explanation: 'TensorFlow.js Deep Neural Recommender latent preference match',
    }));

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}
