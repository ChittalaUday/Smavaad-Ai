import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:5001';

  return {
    plugins: [react(), basicSsl()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_SERVER_URL': JSON.stringify(env.VITE_SERVER_URL || '/'),
      'import.meta.env.VITE_SOCKET_URI': JSON.stringify(env.VITE_SOCKET_URI || '/'),
      'import.meta.env.VITE_SIGNALLING_SERVER_URL': JSON.stringify(env.VITE_SIGNALLING_SERVER_URL || '/'),
    },
  }
})
