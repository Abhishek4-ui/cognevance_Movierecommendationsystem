# CineAI Machine Learning Architecture

## Pure JavaScript AI/ML Pipeline

CineAI is engineered with **100% JavaScript (ES6+ / Node.js / TensorFlow.js)** with **zero Python dependencies**.

```
[ Raw Movie Metadata & Interactions ]
                 │
  ┌──────────────┴──────────────┐
  ▼                             ▼
[ Content-Based Pipeline ]    [ Collaborative Filtering ]
  • Feature Soup Constructor    • User-Item Rating Matrix
  • Tokenizer & Stopwords       • Pearson Correlation (User-User)
  • TF-IDF Vectorizer           • Adjusted Cosine (Item-Item)
  • Cosine Dot Product          • Baseline Bias Adjusted Predictions
  └──────────────┬──────────────┘
                 ▼
  [ TensorFlow.js Neural Embeddings ]
    • Latent Embedding Dimensions (16-D)
    • Deep Dense Multi-Layer Perceptron (32 -> 16 -> 1)
    • Adam Optimizer (lr=0.005) + MSE Loss
                 │
                 ▼
    [ Dynamic Hybrid Recommender ]
      • Dynamic Cold-Start Weighting (New User vs Matured Profile)
      • Scoring Cascade & Deduplication
      • Explainable Reasoning Engine
                 │
                 ▼
    [ Final Ranked Recommendations ]
      • Score & Confidence %
      • Explanation & Feature Match Breakdown
```

### Mathematical Formulas Implemented

1. **TF-IDF & Cosine Similarity**:
   $$\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t',d}}$$
   $$\text{IDF}(t, D) = \ln\left(\frac{1 + |D|}{1 + |\{d \in D: t \in d\}|}\right) + 1.0$$
   $$\text{Cosine}(A, B) = \frac{A \cdot B}{\|A\|_2 \|B\|_2}$$

2. **User-User Pearson Correlation**:
   $$r_{u,v} = \frac{\sum_{i \in I_{uv}} (r_{u,i} - \bar{r}_u)(r_{v,i} - \bar{r}_v)}{\sqrt{\sum (r_{u,i} - \bar{r}_u)^2} \sqrt{\sum (r_{v,i} - \bar{r}_v)^2}}$$

3. **Evaluation Metrics**:
   $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (\hat{y}_i - y_i)^2}$$
   $$\text{MAE} = \frac{1}{N}\sum_{i=1}^N |\hat{y}_i - y_i|$$
   $$\text{NDCG@K} = \frac{\text{DCG@K}}{\text{IDCG@K}}$$
