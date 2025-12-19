# PM2 Setup Guide for AMAST CRM Backend

## What is PM2?
PM2 is a process manager for Node.js applications that keeps your application running in the background, automatically restarts it if it crashes, and provides monitoring capabilities.

## Installation

### Step 1: Install PM2 Globally
```bash
npm install -g pm2
```

## Starting the Backend with PM2

### Option 1: Simple Start (Quick)
```bash
cd /opt/amast-crm/amast-crm
pm2 start server.js --name amast-crm-backend
```

### Option 2: Using Ecosystem File (Recommended)
```bash
cd /opt/amast-crm/amast-crm

# Create logs directory
mkdir -p logs

# Start using ecosystem config
pm2 start ecosystem.config.js
```

### Option 3: Start with Environment Variables
```bash
cd /opt/amast-crm/amast-crm
pm2 start server.js --name amast-crm-backend --env production
```

## PM2 Commands

### View Running Processes
```bash
pm2 list
# or
pm2 status
```

### View Logs
```bash
# View all logs
pm2 logs amast-crm-backend

# View only error logs
pm2 logs amast-crm-backend --err

# View only output logs
pm2 logs amast-crm-backend --out

# View last 100 lines
pm2 logs amast-crm-backend --lines 100

# Follow logs in real-time
pm2 logs amast-crm-backend --lines 0
```

### Stop/Start/Restart
```bash
# Stop the application
pm2 stop amast-crm-backend

# Start the application
pm2 start amast-crm-backend

# Restart the application
pm2 restart amast-crm-backend

# Reload (zero-downtime restart)
pm2 reload amast-crm-backend
```

### Delete Process
```bash
pm2 delete amast-crm-backend
```

### Monitor Resources
```bash
# Real-time monitoring
pm2 monit

# Show detailed info
pm2 show amast-crm-backend
```

## Save PM2 Configuration

After starting your application, save the PM2 process list so it persists across server reboots:

```bash
pm2 save
```

## Setup Auto-Start on Boot

To ensure PM2 starts automatically when the server reboots:

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Run the command it outputs, then save
pm2 save
```

## Useful PM2 Features

### Cluster Mode (Multiple Instances)
If you want to run multiple instances for load balancing:

```bash
pm2 start server.js --name amast-crm-backend -i 2
# This will start 2 instances
```

### Update Ecosystem Config
Edit `ecosystem.config.js` and reload:

```bash
pm2 reload ecosystem.config.js
```

### Environment Variables
You can set environment variables in the ecosystem file or use `.env` file (which should be loaded automatically by your app).

## Troubleshooting

### Check if PM2 is Running
```bash
pm2 ping
```

### View All Logs
```bash
pm2 logs --lines 200
```

### Clear Logs
```bash
pm2 flush
```

### Restart All Processes
```bash
pm2 restart all
```

### Check Process Details
```bash
pm2 describe amast-crm-backend
```

## Quick Start Script

Here's a complete setup script you can run:

```bash
#!/bin/bash
cd /opt/amast-crm/amast-crm

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Stop existing process if running
pm2 delete amast-crm-backend 2>/dev/null

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start
pm2 startup

echo "✓ Backend started with PM2"
echo "View logs: pm2 logs amast-crm-backend"
echo "View status: pm2 status"
```

## Verification

After starting, verify everything is working:

```bash
# Check status
pm2 status

# Check logs for errors
pm2 logs amast-crm-backend --lines 50

# Test API endpoint
curl http://localhost:3000/api/health
# or
curl http://localhost:3000/api/auth/me
```

## Production Best Practices

1. **Use ecosystem.config.js** for better configuration management
2. **Set up log rotation** to prevent log files from growing too large
3. **Monitor memory usage** and set `max_memory_restart` if needed
4. **Use cluster mode** only if you have multiple CPU cores and high traffic
5. **Set up monitoring** with PM2 Plus (optional) for production environments

## Log Rotation Setup

To prevent log files from growing indefinitely, you can install pm2-logrotate:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

