# Nginx Setup Guide for AMAST CRM

## Overview
This guide will help you configure Nginx as a reverse proxy for the AMAST CRM application, serving the frontend and proxying API requests to the backend.

## Prerequisites
- Nginx installed on your server
- Backend running with PM2 on port 3000
- Frontend built and available in `frontend/dist`

## Step 1: Install Nginx

```bash
# Ubuntu/Debian
apt-get update
apt-get install -y nginx

# CentOS/RHEL
yum install -y nginx
```

## Step 2: Build Frontend for Production

```bash
cd /opt/amast-crm/amast-crm/frontend
npm install
npm run build

# Verify build output
ls -la dist/
```

## Step 3: Copy Nginx Configuration

```bash
cd /opt/amast-crm/amast-crm

# Copy configuration to Nginx sites-available
sudo cp nginx/amast-crm.conf /etc/nginx/sites-available/amast-crm

# Edit the configuration
sudo nano /etc/nginx/sites-available/amast-crm
```

**Important:** Update these values in the config file:
- `server_name your-domain.com www.your-domain.com;` - Replace with your actual domain or IP
- If using IP only, you can use: `server_name _;` or `server_name 47.250.126.192;`

## Step 4: Enable the Site

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

## Step 5: Start/Restart Nginx

```bash
# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Restart Nginx (after configuration changes)
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

## Step 6: Verify Backend is Running

Make sure your backend is running with PM2 on port 3000:

```bash
# Check PM2 status
pm2 status

# Check if backend is listening on port 3000
netstat -tlnp | grep 3000
# or
ss -tlnp | grep 3000
```

## Step 7: Update Backend CORS Settings

Make sure your `.env` file has the correct frontend URL:

```bash
cd /opt/amast-crm/amast-crm
nano .env
```

Add or update:
```env
CORS_ORIGIN=http://your-domain.com
# or if using IP:
CORS_ORIGIN=http://47.250.126.192
```

Then restart the backend:
```bash
pm2 restart amast-crm-backend
```

## Step 8: Test the Setup

```bash
# Test Nginx configuration
sudo nginx -t

# Test backend API directly
curl http://localhost:3000/api/health

# Test through Nginx
curl http://your-domain.com/api/health
# or
curl http://47.250.126.192/api/health
```

## Firewall Configuration

If you have a firewall, allow HTTP and HTTPS:

```bash
# UFW (Ubuntu)
sudo ufw allow 'Nginx Full'
# or
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically update your Nginx config
# Test auto-renewal
sudo certbot renew --dry-run
```

After SSL setup, uncomment the SSL lines in the Nginx config and update the certificate paths.

## Troubleshooting

### Check Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/amast-crm-error.log
```

### Check Nginx Access Logs
```bash
sudo tail -f /var/log/nginx/amast-crm-access.log
```

### Test Backend Connection
```bash
# From server, test if backend is accessible
curl http://localhost:3000/api/health
```

### Check Port Binding
```bash
# Check if port 3000 is in use
sudo lsof -i :3000
# or
sudo netstat -tlnp | grep 3000
```

### Reload Nginx After Changes
```bash
# Test configuration first
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

## Common Issues

### 502 Bad Gateway
- Backend is not running: `pm2 start ecosystem.config.js`
- Backend is not on port 3000: Check `.env` file
- Firewall blocking: Check firewall rules

### 404 Not Found (Frontend)
- Frontend not built: Run `npm run build` in frontend directory
- Wrong root path: Check `root` directive in Nginx config
- Files not in dist: Verify `frontend/dist` exists

### CORS Errors
- Update `CORS_ORIGIN` in `.env` file
- Restart backend: `pm2 restart amast-crm-backend`

## Quick Setup Script

```bash
#!/bin/bash

# Build frontend
cd /opt/amast-crm/amast-crm/frontend
npm run build

# Copy Nginx config
sudo cp /opt/amast-crm/amast-crm/nginx/amast-crm.conf /etc/nginx/sites-available/amast-crm

# Edit server_name in config (replace with your domain/IP)
sudo sed -i 's/your-domain.com/47.250.126.192/g' /etc/nginx/sites-available/amast-crm

# Enable site
sudo ln -sf /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/

# Test and restart
sudo nginx -t && sudo systemctl restart nginx

echo "✓ Nginx configured. Access your app at http://47.250.126.192"
```

## Production Checklist

- [ ] Frontend built (`npm run build`)
- [ ] Backend running with PM2
- [ ] Nginx configuration file copied
- [ ] Server name updated in Nginx config
- [ ] Site enabled and default site removed
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx restarted
- [ ] Firewall configured (ports 80, 443)
- [ ] CORS_ORIGIN updated in `.env`
- [ ] Backend restarted after `.env` changes
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Tested API endpoints through Nginx
- [ ] Tested frontend access

## Port Management

With Nginx managing ports:
- **Port 80 (HTTP)**: Nginx listens here, serves frontend and proxies API
- **Port 443 (HTTPS)**: Nginx listens here when SSL is configured
- **Port 3000**: Backend runs here (internal, not exposed directly)
- **PM2**: Manages the backend process on port 3000

Users access the application through port 80/443, and Nginx handles routing to the appropriate service.

