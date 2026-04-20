module.exports = {
  apps: [
    {
      name: 'samvaad-backend',
      cwd: './backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    },
    {
      name: 'samvaad-ai',
      cwd: './ai-services',
      script: './venv/bin/python3',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8000'
    },
    {
      name: 'samvaad-client',
      cwd: './client',
      script: 'npm',
      args: 'run dev -- --port 3002 --host', // Using dev for testing, or swap to preview if preferred
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
