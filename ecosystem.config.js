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
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      merge_logs: true,
      kill_timeout: 5000
    }
  ]
};

