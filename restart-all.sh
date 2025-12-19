#!/bin/bash

echo "=========================================="
echo "Restarting AMAST CRM (Backend + Frontend)"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Fix port conflict
echo ""
echo "Step 1: Fixing port conflicts..."
./fix-port-conflict.sh

# Step 2: Rebuild frontend (if needed)
echo ""
read -p "Rebuild frontend? (y/n) [n]: " REBUILD
if [ "$REBUILD" = "y" ] || [ "$REBUILD" = "Y" ]; then
    echo "Rebuilding frontend..."
    cd frontend
    npm run build
    cd ..
    echo "✓ Frontend rebuilt"
fi

# Step 3: Start backend with PM2
echo ""
echo "Step 2: Starting backend with PM2..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✓ Backend started"
    
    # Save PM2 config
    pm2 save
    
    # Show status
    echo ""
    echo "PM2 Status:"
    pm2 status
    
    echo ""
    echo "=========================================="
    echo "✓ Restart Complete!"
    echo "=========================================="
    echo ""
    echo "Backend: Running on port 3000 (PM2)"
    echo "Frontend: Served by Nginx from frontend/dist/"
    echo ""
    echo "Test backend: curl http://localhost:3000/api/health"
    echo "View logs: pm2 logs amast-crm-backend"
    echo ""
else
    echo "✗ Failed to start backend"
    echo "Check logs: pm2 logs amast-crm-backend"
    exit 1
fi

