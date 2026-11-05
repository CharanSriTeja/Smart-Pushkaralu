import { app } from './app.js';
import { env } from './config/env.js';
import { initFirebase } from './services/firebase.js';

initFirebase();

const server = app.listen(env.PORT, () => {
  console.log(`[Server] Smart Pushkaralu API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

