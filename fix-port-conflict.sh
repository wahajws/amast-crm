#!/bin/bash

echo "=========================================="
echo "Fixing Port 3000 Conflict"
echo "=========================================="

# Find what's using port 3000
echo ""
echo "Checking what's using port 3000..."
PID=$(lsof -ti:3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)

if [ ! -z "$PID" ]; then
    echo "Found process using port 3000: PID $PID"
    echo "Killing process..."
    kill -9 $PID 2>/dev/null
    sleep 2
    echo "✓ Process killed"
else
    echo "✓ Port 3000 is free"
fi

# Stop all PM2 processes
echo ""
echo "Stopping all PM2 processes..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sleep 2

# Verify port is free
echo ""
echo "Verifying port 3000 is free..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Port 3000 still in use. Trying to kill again..."
    kill -9 $(lsof -ti:3000) 2>/dev/null
    sleep 2
fi

if ! lsof -ti:3000 >/dev/null 2>&1; then
    echo "✓ Port 3000 is now free"
else
    echo "✗ Port 3000 is still in use. Please check manually:"
    echo "  lsof -i :3000"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Port conflict resolved!"
echo "=========================================="
echo ""
echo "You can now start the backend:"
echo "  cd /opt/amast-crm/amast-crm"
echo "  pm2 start ecosystem.config.js"
echo ""

