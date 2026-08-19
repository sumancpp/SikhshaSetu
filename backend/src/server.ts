import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server);

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Explicit CORS
const allowedOrigins = [
  env.FRONTEND_URL,
  'https://sikhshasetu-frontend.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        env.NODE_ENV === 'development' ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Standard Middlewares
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folder for uploaded files
const uploadPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.use('/uploads', express.static(uploadPath));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EduKollab Backend',
    environment: env.NODE_ENV,
  });
});

// Rate limiting and API routes
app.use('/api', apiLimiter, apiRouter);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`,
    code: 'NOT_FOUND',
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Connect DB & Start Server
const PORT = parseInt(env.PORT, 10) || 5000;

import { Achievement } from './models/Achievement.js';
import { SYSTEM_ACHIEVEMENTS } from './constants/achievements.js';

export const startServer = async () => {
  await connectDB();

  // Ensure system achievements/badges exist for rewarding users
  const achievementCount = await Achievement.countDocuments();
  if (achievementCount === 0) {
    console.log('🏆 Initializing system achievements/badges...');
    await Achievement.insertMany(SYSTEM_ACHIEVEMENTS);
  }

  server.listen(PORT, () => {
    console.log(`\n🚀 ShikshaSetu Server running on http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Frontend Allowed Origin: ${env.FRONTEND_URL}\n`);
  });
};

if (env.NODE_ENV !== 'test') {
  startServer();
}

export { app, server };
