import http from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env, getCorsOrigins } from './config/env.js';
import { initFirebase } from './services/firebase.js';
import { pool, verifyPostgis } from './db/index.js';
import { NewsExpiryJob } from './jobs/newsExpiryJob.js';
import { CachePrewarmJob } from './jobs/cachePrewarmJob.js';
import { initSosSocket } from './services/sos-socket.js';

// Initialize Firebase Admin credentials
initFirebase();

// Verify PostGIS extension is available
try {
  const postgisVersion = await verifyPostgis();
  console.log(`[DB] PostGIS extension verified: ${postgisVersion}`);
} catch (err: any) {
  console.error('[DB] PostGIS verification error:', err.message);
  if (env.NODE_ENV === 'production') {
    throw err;
  }
}

// Start background scheduled jobs in-process only if explicitly enabled
if (env.ENABLE_SCHEDULER) {
  console.log('[Scheduler] In-process scheduler enabled.');
  NewsExpiryJob.start(60000); // Check every 60 seconds
  CachePrewarmJob.start(12 * 60 * 60 * 1000); // Run pre-warm every 12 hours
} else {
  console.log('[Scheduler] In-process scheduler disabled. Use standalone scripts or external cron in production.');
}

const server = http.createServer(app);

// ARCHITECTURE NOTE:
// Socket.io is configured with the in-memory adapter for single-instance web service deployments.
// If scaling horizontally to multiple instances, configure @socket.io/redis-adapter with a Redis URL.
const allowedOrigins = getCorsOrigins();
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (env.NODE_ENV !== 'production') {
        if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

initSosSocket(io);

// Explicitly bind to 0.0.0.0 for containerized / Render deployments
server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[Server] Smart Pushkaralu API running on 0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
});

let isShuttingDown = false;
const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);

  if (env.ENABLE_SCHEDULER) {
    NewsExpiryJob.stop();
    CachePrewarmJob.stop();
  }

  io.close(() => {
    console.log('[Server] Socket.io closed.');
  });

  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await pool.end();
      console.log('[Server] Database pool closed.');
    } catch (err: any) {
      console.error('[Server] Error closing database pool:', err.message);
    }
    console.log('[Server] Process terminated.');
    process.exit(0);
  });

  // Force exit if graceful cleanup exceeds 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
