import express from 'express';
import routes from './routes';
import config from './config/env';
import emailRoutes from './routes/email.routes';
import smsRoutes from './routes/sms.routes';
import { database } from './config/database';

const app = express();

// Initialize database connection on startup
async function initializeDatabase() {
  try {
    await database.connect();
    console.log('Database connection established');
    
    // Setup graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  try {
    await database.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = database.getConnection() ? 'connected' : 'disconnected';
  
  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus,
    timestamp: new Date().toISOString(),
    service: 'notification-service',
    database: dbStatus
  });
});

// Routes
app.use('/api', routes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/sms', smsRoutes);

// Initialize database when starting the app
initializeDatabase().catch(err => {
  console.error('Application startup failed:', err);
  process.exit(1);
});

export default app;
