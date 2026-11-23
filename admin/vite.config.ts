import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (command === 'build') {
    const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL;
    const socketUrl = process.env.VITE_SOCKET_URL || env.VITE_SOCKET_URL;

    if (
      !apiUrl ||
      typeof apiUrl !== 'string' ||
      (!apiUrl.startsWith('https://') &&
        !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(apiUrl))
    ) {
      throw new Error(
        `[Production Build Error] VITE_API_URL is required and must start with https://. Received: ${apiUrl || 'undefined'}`
      );
    }

    if (
      !socketUrl ||
      typeof socketUrl !== 'string' ||
      (!socketUrl.startsWith('https://') &&
        !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(socketUrl))
    ) {
      throw new Error(
        `[Production Build Error] VITE_SOCKET_URL is required and must start with https://. Received: ${socketUrl || 'undefined'}`
      );
    }
  }

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
    },
    server: {
      port: 5173,
    },
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  };
});
