# How to Check Backend Logs on Server

## PM2 Logs (Recommended)

Since the backend is running with PM2, use these commands:

### View all logs
```bash
pm2 logs amast-crm-backend
```

### View only error logs
```bash
pm2 logs amast-crm-backend --err
```

### View only output logs
```bash
pm2 logs amast-crm-backend --out
```

### View last N lines
```bash
pm2 logs amast-crm-backend --lines 100
```

### Follow logs in real-time (like tail -f)
```bash
pm2 logs amast-crm-backend --lines 50
# Press Ctrl+C to exit
```

### View logs without following
```bash
pm2 logs amast-crm-backend --lines 200 --nostream
```

## PM2 Log File Locations

PM2 stores logs in:
```bash
# View log file locations
pm2 show amast-crm-backend

# Or check directly:
~/.pm2/logs/amast-crm-backend-out.log    # Standard output
~/.pm2/logs/amast-crm-backend-error.log  # Error output
```

### View log files directly
```bash
# View output log
tail -f ~/.pm2/logs/amast-crm-backend-out.log

# View error log
tail -f ~/.pm2/logs/amast-crm-backend-error.log

# View last 100 lines
tail -n 100 ~/.pm2/logs/amast-crm-backend-out.log
```

## PM2 Status and Info

### Check if backend is running
```bash
pm2 list
pm2 status
```

### Get detailed info about the process
```bash
pm2 show amast-crm-backend
pm2 info amast-crm-backend
```

### View process monitoring
```bash
pm2 monit
```

## Application Logs (Winston)

If the application uses Winston logger, logs might also be in:

```bash
# Check project directory
cd /opt/amast-crm/amast-crm

# Look for logs directory
ls -la logs/

# View application logs
tail -f logs/combined.log
tail -f logs/error.log
```

## Nginx Logs (If relevant)

If you need to check Nginx logs for API requests:

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# Or if using custom location
tail -f /var/log/nginx/amast-crm-access.log
tail -f /var/log/nginx/amast-crm-error.log
```

## Quick Commands Summary

```bash
# Most common: View real-time logs
pm2 logs amast-crm-backend

# View last 100 lines
pm2 logs amast-crm-backend --lines 100 --nostream

# Check if running
pm2 list

# Restart if needed
pm2 restart amast-crm-backend

# View errors only
pm2 logs amast-crm-backend --err --lines 50
```

## Filter Logs

### Search for specific text
```bash
pm2 logs amast-crm-backend --lines 500 --nostream | grep "error"
pm2 logs amast-crm-backend --lines 500 --nostream | grep "401"
pm2 logs amast-crm-backend --lines 500 --nostream | grep "database"
```

### Save logs to file
```bash
pm2 logs amast-crm-backend --lines 1000 --nostream > backend_logs.txt
```

