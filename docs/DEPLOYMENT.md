# CineAI Production Deployment Guide

## 1. Local Development
```bash
# Terminal 1: Backend & AI Engine
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```
Visit `http://localhost:5173`

---

## 2. Docker & Docker Compose Deployment
```bash
# Build and run complete multi-container stack (MongoDB + Backend + Frontend Nginx)
docker-compose up --build -d

# Check running status
docker-compose ps

# View container logs
docker-compose logs -f backend
```
Visit `http://localhost:80`

---

## 3. Cloud Deployment

### A. Frontend (Vercel)
1. Deploy `frontend/` directory to Vercel.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api`

### B. Backend (Render / Railway)
1. Deploy root repository with root directory set to `backend/`.
2. Build Command: `cd ../ai-engine && npm ci && cd ../backend && npm ci`
3. Start Command: `node server.js`
4. Environment Variables:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `JWT_ACCESS_SECRET`: 64-character secret
   - `JWT_REFRESH_SECRET`: 64-character secret
   - `TMDB_API_KEY`: Your TMDB API Key
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
