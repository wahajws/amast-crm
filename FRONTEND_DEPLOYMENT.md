# Frontend Deployment Guide

## Overview

The frontend is a **React/Vite application** that gets built into static files and served by Nginx. Unlike the backend, the frontend does **not** run as a Node.js process with PM2 in production.

## Standard Production Setup (Recommended)

### Step 1: Build Frontend

```bash
cd /opt/amast-crm/amast-crm/frontend

# Install dependencies (first time only)
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files.

### Step 2: Nginx Serves Static Files

Nginx is already configured to serve the frontend from `frontend/dist/`. The configuration in `nginx/amast-crm.conf` handles:

- Serving static files from `/opt/amast-crm/amast-crm/frontend/dist`
- Proxying `/api` requests to the backend
- Handling client-side routing (SPA)

### Step 3: Verify Build

```bash
# Check if dist folder exists
ls -la /opt/amast-crm/amast-crm/frontend/dist

# Should see: index.html, assets/, etc.
```

### Step 4: Restart Nginx (if needed)

```bash
sudo systemctl restart nginx
```

## Automated Build Script

Use the provided script for easy building:

```bash
cd /opt/amast-crm/amast-crm
chmod +x build-frontend.sh
./build-frontend.sh
```

## Updating Frontend

When you update the frontend code:

```bash
cd /opt/amast-crm/amast-crm

# Pull latest changes
git pull

# Rebuild frontend
cd frontend
npm install  # Only if package.json changed
npm run build

# Restart Nginx (to serve new files)
sudo systemctl restart nginx
```

## Environment Variables

Frontend environment variables are set during build time. Create a `.env.production` file in the `frontend/` directory:

```bash
cd /opt/amast-crm/amast-crm/frontend
nano .env.production
```

Add:
```env
VITE_API_URL=http://47.250.126.192/api
# or if using domain:
VITE_API_URL=http://your-domain.com/api
```

Then rebuild:
```bash
npm run build
```

## Why Not PM2 for Frontend?

**Frontend applications are static files**, not Node.js processes:
- ✅ **Built once**: `npm run build` creates optimized HTML/CSS/JS files
- ✅ **Served by Nginx**: Fast, efficient static file serving
- ✅ **No runtime**: No Node.js process needed
- ✅ **Better performance**: Nginx is optimized for static content

**PM2 is for Node.js applications** (like your backend), not static files.

## Alternative: Development Server (Not Recommended for Production)

If you absolutely need to run the Vite dev server in production (not recommended), you could use PM2:

```bash
# Add to ecosystem.config.js (uncomment the frontend section)
pm2 start ecosystem.config.js
```

**But this is NOT recommended** because:
- ❌ Dev server is slower
- ❌ Not optimized for production
- ❌ Uses more resources
- ❌ No hot-reload benefits in production

## Troubleshooting

### Build Fails

```bash
# Clear node_modules and reinstall
cd /opt/amast-crm/amast-crm/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Frontend Not Loading

1. **Check if dist folder exists:**
   ```bash
   ls -la /opt/amast-crm/amast-crm/frontend/dist
   ```

2. **Check Nginx configuration:**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/amast-crm-error.log
   ```

3. **Verify Nginx root path:**
   ```bash
   # In nginx/amast-crm.conf, check:
   root /opt/amast-crm/amast-crm/frontend/dist;
   ```

4. **Check file permissions:**
   ```bash
   sudo chown -R www-data:www-data /opt/amast-crm/amast-crm/frontend/dist
   ```

### API Calls Failing

Check if the API URL is correct in your frontend build. The frontend needs to know where the backend API is:

1. **Check `.env.production`:**
   ```bash
   cat frontend/.env.production
   ```

2. **Rebuild if changed:**
   ```bash
   cd frontend
   npm run build
   ```

### 404 Errors on Routes

This is normal for SPAs. Nginx should handle it with:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Verify this is in your Nginx config.

## Production Checklist

- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] `dist/` folder exists and has files
- [ ] `.env.production` configured (if needed)
- [ ] Nginx configured to serve `frontend/dist`
- [ ] Nginx restarted after build
- [ ] File permissions correct
- [ ] Test frontend loads in browser
- [ ] Test API calls work from frontend

## Quick Reference

```bash
# Build frontend
cd /opt/amast-crm/amast-crm/frontend && npm run build

# Or use script
./build-frontend.sh

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/amast-crm-error.log
```

