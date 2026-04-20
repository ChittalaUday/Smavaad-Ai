module.exports = {
  apps: [
    {
      name: 'samvaad-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'samvaad-ai',
      cwd: './ai-services',
      script: 'uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'python3'
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
