import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database.js';
import railwayChatRoutes from './routes/railway-chat.routes.js';
import mediaRoutes from './routes/media.routes.js';
import localAuthRoutes from './routes/auth-local.routes.js';
import railwayHomeRoutes from './routes/railway-home.routes.js';
import railwayAuthRoutes from './routes/railway-auth.routes.js';
import railwayUsersRoutes from './routes/railway-users.routes.js';
import railwayTeamsRoutes from './routes/railway-teams.routes.js';
import railwayTournamentsRoutes from './routes/railway-tournaments.routes.js';
import railwayPostsRoutes from './routes/railway-posts.routes.js';
import railwayNotificationsRoutes from './routes/railway-notifications.routes.js';
import realtimeRoutes from './routes/railway-realtime.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
});
app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Routes
// Auth routes (no middleware needed - handles its own auth)
app.use('/api/local-auth', localAuthRoutes);

// Optional media route (kept if not Supabase-dependent)
app.use('/api/media', mediaRoutes);
app.use('/api/railway-chat', railwayChatRoutes);

// Mixed routes (some endpoints require auth, some don't)
app.use('/api/railway-home', railwayHomeRoutes);
app.use('/api/railway-auth', railwayAuthRoutes);
app.use('/api/railway-users', railwayUsersRoutes);
app.use('/api/railway-teams', railwayTeamsRoutes);
app.use('/api/railway-tournaments', railwayTournamentsRoutes);
app.use('/api/railway-posts', railwayPostsRoutes);
app.use('/api/railway-notifications', railwayNotificationsRoutes);
app.use('/api/realtime', realtimeRoutes);
// Removed Supabase-dependent routes (users, teams, tournaments, messages, notifications, contact)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`Railway DB: Connected`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
