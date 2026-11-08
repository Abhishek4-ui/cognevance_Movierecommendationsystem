import express from 'express';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { aiEngineService } from './services/aiEngineService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import ratingReviewRoutes from './routes/ratingReviewRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiChatRoutes from './routes/aiChatRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
export const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  // Join private room based on authenticated user ID
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', () => {});
});

// Security & Parsing Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during dev / sandbox
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 500, // requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ratings', ratingReviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiChatRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[API Error] ${err.message}`, err.stack);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

const PORT = process.env.PORT || 5001;

// Export app for test runners (Supertest)
export { app, server };

if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(async () => {
      // Warm up AI Engine asynchronously
      aiEngineService.syncAndTrain().catch((err) => {
        console.warn('[AI Startup Warning] Warmup sync deferred:', err.message);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[CineAI Server] Port ${PORT} is already in use. Please terminate existing node processes or restart.`);
          process.exit(1);
        } else {
          console.error('[CineAI Server Error]', err.message);
        }
      });

      server.listen(PORT, () => {
        console.log(`[CineAI Server] Backend listening on http://localhost:${PORT}`);
        console.log(`[CineAI Server] REST API available at http://localhost:${PORT}/api`);
      });

      const gracefulShutdown = async (signal) => {
        console.log(`\n[CineAI Server] Received ${signal}. Shutting down cleanly...`);
        server.close(async () => {
          try {
            const mongoose = (await import('mongoose')).default;
            if (mongoose.connection.readyState !== 0) {
              await mongoose.connection.close();
            }
          } catch {}
          process.exit(0);
        });
        setTimeout(() => process.exit(0), 2000).unref();
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    })
    .catch((err) => {
      console.error('[CineAI Server Fatal] Could not start server due to DB connection failure:', err.message);
    });
}
