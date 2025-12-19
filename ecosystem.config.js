module.exports = {
  apps: [
    {
      name: 'amast-crm-backend',
      script: 'server.js',
      cwd: '/opt/amast-crm/amast-crm',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000  // Port managed by Nginx reverse proxy
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,  // Reduced to prevent rapid restart loops
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      merge_logs: true,
      kill_timeout: 5000,
      wait_ready: true,  // Wait for app to be ready
      listen_timeout: 10000  // Wait 10s for app to start listening
    }
    // Note: Frontend is built as static files and served by Nginx
    // No PM2 process needed for frontend in production
    // If you need to run Vite dev server (not recommended for production), uncomment below:
    /*
    {
      name: 'amast-crm-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/opt/amast-crm/amast-crm/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: './logs/pm2-frontend-error.log',
      out_file: './logs/pm2-frontend-out.log',
      time: true,
      autorestart: true,
      watch: false
    }
    */
  ]
};

