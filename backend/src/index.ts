import http from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env, getCorsOrigins } from './config/env.js';
import { initFirebase } from './services/firebase.js';
import { NewsExpiryJob } from './jobs/newsExpiryJob.js';
import { CachePrewarmJob } from './jobs/cachePrewarmJob.js';
import { initSosSocket } from './services/sos-socket.js';

initFirebase();

// Start background scheduled jobs
NewsExpiryJob.start(60000); // Check every 60 seconds
CachePrewarmJob.start(12 * 60 * 60 * 1000); // Run pre-warm every 12 hours

const server = http.createServer(app);

const allowedOrigins = getCorsOrigins();
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        env.NODE_ENV !== 'production' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

initSosSocket(io);

server.listen(env.PORT, () => {
  console.log(`[Server] Smart Pushkaralu API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = () => {
  console.log('[Server] Shutting down gracefully...');
  NewsExpiryJob.stop();
  CachePrewarmJob.stop();
  io.close();
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
