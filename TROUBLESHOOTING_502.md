# Troubleshooting 502 Bad Gateway

## Common Causes

1. **Backend not running** - Most common cause
2. **Backend on wrong port** - Nginx expects port 3000
3. **Nginx configuration issue** - Wrong proxy_pass URL
4. **Firewall blocking** - Port 3000 not accessible

## Quick Fix Steps

### Step 1: Check if Backend is Running

```bash
# Check PM2 status
pm2 list

# If empty, start the backend
cd /opt/amast-crm/amast-crm
pm2 start ecosystem.config.js

# Check status again
pm2 status
```

### Step 2: Verify Backend is Listening

```bash
# Check if port 3000 is in use
netstat -tlnp | grep 3000
# or
ss -tlnp | grep 3000

# Test backend directly
curl http://localhost:3000/api/health
```

### Step 3: Check Nginx Configuration

```bash
# Verify Nginx config
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/amast-crm-error.log
```

### Step 4: Verify Nginx Proxy Settings

Make sure in `/etc/nginx/sites-available/amast-crm`:

```nginx
upstream amast_crm_backend {
    server localhost:3000;  # Must match backend port
    keepalive 64;
}

location /api {
    proxy_pass http://amast_crm_backend;  # Must use upstream name
    ...
}
```

## Complete Setup Checklist

- [ ] Database created and migrations run
- [ ] .env file configured correctly
- [ ] Backend started with PM2
- [ ] Backend listening on port 3000
- [ ] Frontend built (dist folder exists)
- [ ] Nginx configured and enabled
- [ ] Nginx restarted after configuration
- [ ] Firewall allows port 80 (and 443 if using SSL)

