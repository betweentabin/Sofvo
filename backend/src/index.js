import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/supabase.js';
import { verifySupabaseToken } from './middleware/supabase-auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import contactRoutes from './routes/contact.routes.js';
import railwayChatRoutes from './routes/railway-chat.routes.js';
import mediaRoutes from './routes/media.routes.js';
import homeRoutes from './routes/home.routes.js';
import railwayHomeRoutes from './routes/railway-home.routes.js';
import railwayUsersRoutes from './routes/railway-users.routes.js';
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
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/users', verifySupabaseToken, userRoutes);
app.use('/api/teams', verifySupabaseToken, teamRoutes);
app.use('/api/tournaments', verifySupabaseToken, tournamentRoutes);
app.use('/api/messages', verifySupabaseToken, messageRoutes);
app.use('/api/notifications', verifySupabaseToken, notificationRoutes);
app.use('/api/media', verifySupabaseToken, mediaRoutes);
app.use('/api/railway-chat', railwayChatRoutes);

// Mixed routes (some endpoints require auth, some don't)
app.use('/api/home', homeRoutes);
app.use('/api/railway-home', railwayHomeRoutes);
app.use('/api/railway-users', railwayUsersRoutes);
app.use('/api/contact', contactRoutes); // Contact doesn't require auth

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Test Supabase database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase database');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`Supabase integration: Active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
