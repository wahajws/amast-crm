#!/bin/bash

echo "=========================================="
echo "Clean Start - AMAST CRM"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Fix port conflicts
echo ""
echo "Step 1: Fixing port conflicts..."
./fix-port-conflict.sh

# Step 2: Clean PM2
echo ""
echo "Step 2: Cleaning PM2..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
pm2 flush 2>/dev/null
sleep 2

# Step 3: Verify port is free
echo ""
echo "Step 3: Verifying port 3000 is free..."
if command -v lsof &> /dev/null; then
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "✗ Port 3000 is still in use!"
        lsof -i :3000
        echo ""
        echo "Please manually kill the process above, then run this script again."
        exit 1
    else
        echo "✓ Port 3000 is free"
    fi
fi

# Step 4: Start backend
echo ""
echo "Step 4: Starting backend with PM2..."
pm2 start ecosystem.config.js

# Wait a moment for startup
sleep 3

# Step 5: Check status
echo ""
echo "Step 5: Checking status..."
pm2 status

# Step 6: Check logs for errors
echo ""
echo "Step 6: Checking logs..."
pm2 logs amast-crm-backend --lines 10 --nostream

# Step 7: Test backend
echo ""
echo "Step 7: Testing backend..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✓ Backend is responding!"
    curl http://localhost:3000/api/health
else
    echo "✗ Backend is not responding. Check logs:"
    echo "  pm2 logs amast-crm-backend"
fi

# Step 8: Save PM2 config
echo ""
echo "Step 8: Saving PM2 configuration..."
pm2 save

echo ""
echo "=========================================="
echo "✓ Clean start complete!"
echo "=========================================="
echo ""
echo "Backend status:"
pm2 status
echo ""
echo "View logs: pm2 logs amast-crm-backend"
echo "Restart: pm2 restart amast-crm-backend"
echo ""

