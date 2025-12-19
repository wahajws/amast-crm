#!/bin/bash

echo "=========================================="
echo "Fixing Port 3000 Conflict"
echo "=========================================="

# Stop all PM2 processes first
echo ""
echo "Stopping all PM2 processes..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sleep 3

# Find and kill ALL processes using port 3000
echo ""
echo "Finding all processes using port 3000..."

# Try multiple methods to find the process
PIDS=""
if command -v lsof &> /dev/null; then
    PIDS=$(lsof -ti:3000 2>/dev/null)
elif command -v fuser &> /dev/null; then
    PIDS=$(fuser 3000/tcp 2>/dev/null | awk '{print $1}')
elif command -v netstat &> /dev/null; then
    PIDS=$(netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | grep -v '-' | head -1)
elif command -v ss &> /dev/null; then
    PIDS=$(ss -tlnp 2>/dev/null | grep :3000 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
fi

if [ ! -z "$PIDS" ]; then
    echo "Found process(es) using port 3000: $PIDS"
    for PID in $PIDS; do
        if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
            echo "Killing process: $PID"
            kill -9 $PID 2>/dev/null
        fi
    done
    sleep 3
    echo "✓ Processes killed"
else
    echo "No process found using port 3000"
fi

# Force kill any remaining processes
echo ""
echo "Force killing any remaining processes on port 3000..."
if command -v lsof &> /dev/null; then
    lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null
fi
sleep 2

# Verify port is free
echo ""
echo "Verifying port 3000 is free..."
if command -v lsof &> /dev/null; then
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "⚠️  Port 3000 still in use. Showing details:"
        lsof -i :3000
        echo ""
        echo "Attempting final kill..."
        lsof -ti:3000 | xargs -r kill -9 2>/dev/null
        sleep 2
    fi
fi

# Final check
if command -v lsof &> /dev/null; then
    if ! lsof -ti:3000 >/dev/null 2>&1; then
        echo "✓ Port 3000 is now free"
    else
        echo "✗ Port 3000 is still in use. Details:"
        lsof -i :3000
        echo ""
        echo "Please manually kill the process or change the port in .env"
        exit 1
    fi
else
    echo "⚠️  Cannot verify (lsof not available), but processes should be killed"
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

