import { tokenize } from '../preprocessing/textProcessor.js';

export class TfidfVectorizer {
  constructor(options = {}) {
    this.maxFeatures = options.maxFeatures || 3000;
    this.minDf = options.minDf || 1;
    this.vocabulary = new Map(); // term -> index
    this.idf = [];               // index -> idf weight
    this.documentCount = 0;
  }

  /**
   * Fit the vectorizer on an array of text documents
   * @param {string[]} documents 
   */
  fit(documents) {
    this.documentCount = documents.length;
    const docFreq = new Map();

    // 1. Calculate document frequencies for all terms
    documents.forEach((doc) => {
      const tokens = tokenize(doc);
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach((term) => {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      });
    });

    // 2. Filter terms by minDf and select top maxFeatures
    const sortedTerms = Array.from(docFreq.entries())
      .filter(([_, count]) => count >= this.minDf)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxFeatures);

    this.vocabulary.clear();
    this.idf = new Array(sortedTerms.length);

    sortedTerms.forEach(([term, df], index) => {
      this.vocabulary.set(term, index);
      // Smooth IDF formula: log((1 + N) / (1 + df)) + 1
      this.idf[index] = Math.log((1 + this.documentCount) / (1 + df)) + 1.0;
    });

    return this;
  }

  /**
   * Transform a single document into a sparse/dense L2-normalized TF-IDF vector
   * @param {string} document 
   * @returns {Float64Array}
   */
  transform(document) {
    const vector = new Float64Array(this.vocabulary.size);
    const tokens = tokenize(document);
    if (tokens.length === 0 || this.vocabulary.size === 0) return vector;

    // Term frequencies
    const tfMap = new Map();
    tokens.forEach((term) => {
      if (this.vocabulary.has(term)) {
        tfMap.set(term, (tfMap.get(term) || 0) + 1);
      }
    });

    let normSquared = 0;
    tfMap.forEach((count, term) => {
      const idx = this.vocabulary.get(term);
      const tf = count / tokens.length;
      const tfidf = tf * this.idf[idx];
      vector[idx] = tfidf;
      normSquared += tfidf * tfidf;
    });

    // L2 Normalize
    const norm = Math.sqrt(normSquared);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Fit and transform an array of documents
   * @param {string[]} documents 
   * @returns {Float64Array[]}
   */
  fitTransform(documents) {
    this.fit(documents);
    return documents.map(doc => this.transform(doc));
  }
}
