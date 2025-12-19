# Complete Deployment Guide - Backend + Frontend

## Important: Frontend vs Backend

- **Backend**: Node.js application → Runs with PM2 on port 3000
- **Frontend**: Static files → Built once, served by Nginx (NO PM2 needed)

## Current Issue: Port 3000 Conflict

Your logs show `EADDRINUSE: address already in use :::3000`. This means something is already running on port 3000.

## Quick Fix Steps

### Step 1: Fix Port Conflict

```bash
cd /opt/amast-crm/amast-crm
chmod +x fix-port-conflict.sh
./fix-port-conflict.sh
```

Or manually:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or
kill -9 $(lsof -ti:3000)

# Stop all PM2 processes
pm2 delete all
pm2 kill
```

### Step 2: Start Backend with PM2

```bash
cd /opt/amast-crm/amast-crm

# Start backend
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Check status
pm2 status
```

### Step 3: Verify Backend is Running

```bash
# Test backend
curl http://localhost:3000/api/health

# Check PM2 logs
pm2 logs amast-crm-backend --lines 20
```

### Step 4: Frontend is Already Built

The frontend is already built (you ran `setup-frontend.sh`). Nginx will serve it automatically.

**No PM2 needed for frontend** - it's just static files in `frontend/dist/`.

## Setup Auto-Start on Boot

### Option 1: Using Script

```bash
cd /opt/amast-crm/amast-crm
chmod +x setup-pm2-startup.sh
./setup-pm2-startup.sh
```

### Option 2: Manual

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Run the command it outputs (as root/sudo)

# Then save PM2 config
pm2 save
```

## Complete Restart Script

If you need to restart everything:

```bash
cd /opt/amast-crm/amast-crm
chmod +x restart-all.sh
./restart-all.sh
```

## Architecture Summary

```
┌─────────────────────────────────────────┐
│         User Browser                     │
└──────────────┬──────────────────────────┘
               │
               │ HTTP/HTTPS (Port 80/443)
               │
       ┌───────▼────────┐
       │     Nginx     │
       │  (Port 80/443)│
       └───┬────────┬──┘
           │        │
    ┌──────▼──┐  ┌──▼──────────┐
    │ Frontend│  │   Backend   │
    │  Static │  │   (PM2)    │
    │  Files  │  │ Port 3000   │
    │  (dist/)│  │             │
    └─────────┘  └─────────────┘
```

- **Frontend**: `frontend/dist/` → Served by Nginx (no process)
- **Backend**: `server.js` → PM2 process on port 3000
- **Nginx**: Routes `/` to frontend, `/api` to backend

## Troubleshooting

### Port 3000 Still in Use

```bash
# Find what's using it
lsof -i :3000
# or
netstat -tlnp | grep 3000

# Kill it
kill -9 $(lsof -ti:3000)
```

### PM2 Keeps Restarting

```bash
# Check logs
pm2 logs amast-crm-backend

# Stop and restart
pm2 stop amast-crm-backend
pm2 delete amast-crm-backend
pm2 start ecosystem.config.js
```

### Frontend Not Loading

```bash
# Rebuild frontend
cd /opt/amast-crm/amast-crm/frontend
npm run build

# Restart Nginx
sudo systemctl restart nginx
```

## Verification Checklist

- [ ] Port 3000 is free (no conflicts)
- [ ] Backend running with PM2 (`pm2 status` shows `amast-crm-backend`)
- [ ] Backend responds (`curl http://localhost:3000/api/health`)
- [ ] Frontend built (`ls -la frontend/dist/`)
- [ ] Nginx configured and running (`sudo systemctl status nginx`)
- [ ] PM2 auto-start configured (`pm2 startup` + `pm2 save`)

## Common Commands

```bash
# Backend
pm2 status                    # Check status
pm2 logs amast-crm-backend    # View logs
pm2 restart amast-crm-backend # Restart
pm2 stop amast-crm-backend    # Stop
pm2 delete amast-crm-backend  # Remove

# Frontend
cd frontend && npm run build   # Rebuild

# Nginx
sudo systemctl restart nginx   # Restart
sudo nginx -t                 # Test config
sudo tail -f /var/log/nginx/amast-crm-error.log  # View errors
```

