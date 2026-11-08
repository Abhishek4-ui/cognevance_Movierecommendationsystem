# CineAI - Production AI/ML Movie Recommendation System

A complete, full-stack, real-world AI/ML Movie Recommendation System engineered in **100% JavaScript** using **React.js + Vite + Tailwind CSS**, **Node.js + Express + Socket.IO**, **MongoDB**, and **TensorFlow.js**.

---

## 🌟 Key Highlights

- **100% JavaScript AI/ML**: No Python, no Django/Flask, no microservice bridges. Native execution directly inside Node.js.
- **Genuine Machine Learning Engine**:
  - **Content-Based Filtering**: TF-IDF (Term Frequency - Inverse Document Frequency) vectorizer with L2-normalized cosine similarity.
  - **Collaborative Filtering**: User-Item rating matrix, Pearson correlation, adjusted cosine similarity, and rating prediction with user/item bias.
  - **TensorFlow.js Neural Embeddings**: Deep matrix factorization and multi-layer perceptron neural ranking model with MSE loss.
  - **Hybrid Recommendation Pipeline**: Dynamic weighting that transitions seamlessly between cold-start metadata matching and mature collaborative taste clusters.
  - **Model Evaluation**: Mathematical implementations of **Precision@K**, **Recall@K**, **NDCG@K**, **RMSE**, **MAE**, and Catalog Coverage.
- **Real TMDB API Integration**:
  - Live query resolution with built-in ISP DNS resilience.
  - Intelligent MongoDB caching (`MovieCache`) with feature extraction.
  - Full support for trailers, cast, directors, streaming providers, and keywords.
- **Complete Authentication & Security**:
  - Email OTP verification with 6-digit cryptographic code.
  - JWT access and refresh token rotation in secure HTTP-only cookies.
  - bcrypt password hashing, role-based access control, Helmet, CORS allowlists, and rate limiting.
- **Interactive Cinematic UI/UX**:
  - Dark navy (`#0B0F19`) theme with electric blue (`#38BDF8`) and purple gradients.
  - Responsive navigation, glassmorphism cards, trailer modal, star rating modal, and watchlist manager.
  - Real-time Recharts dashboards for viewing habits and rating distributions.
  - Interactive AI Movie Assistant (Chatbot) and Mood-Based Recommender.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Installation
```bash
# Clone or navigate to the repository
cd MOVIERECOMMENDATION

# Install all sub-packages
npm run install:all
```

### 2. Environment Setup
Configure your `backend/.env` file (see `backend/.env.example`):
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://... (or local mongodb://127.0.0.1:27017/ai_movie_rec)
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
TMDB_AUTH_METHOD=auto
TMDB_ACCESS_TOKEN=your_v4_read_access_token
TMDB_API_KEY=your_v3_api_key
```

*(Note: You can also configure TMDB credentials directly from the application UI via the "TMDB Active / Configure TMDB" button).*

### 3. Run Applications
```bash
# Start both Backend (port 5001) and Frontend (port 5173) concurrently:
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Testing
```bash
# Run AI ML Engine Benchmark & Evaluation
npm run test:ai

# Run Backend Integration Tests (Jest + Native HTTP)
npm run test:backend

# Run Frontend Component Tests (Vitest + React Testing Library)
npm run test:frontend

# Run All Tests
npm run test:all
```

---

## 🐳 Docker Deployment
```bash
docker-compose up --build -d
```
Visit `http://localhost:80`.
