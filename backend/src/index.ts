import { app } from './app.js';
import { env } from './config/env.js';
import { initFirebase } from './services/firebase.js';
import { NewsExpiryJob } from './jobs/newsExpiryJob.js';

initFirebase();

// Start background scheduled expiry job
NewsExpiryJob.start(60000); // Check every 60 seconds

const server = app.listen(env.PORT, () => {
  console.log(`[Server] Smart Pushkaralu API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = () => {
  console.log('[Server] Shutting down gracefully...');
  NewsExpiryJob.stop();
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

