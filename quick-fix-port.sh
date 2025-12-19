#!/bin/bash

echo "=========================================="
echo "Quick Fix: Change Backend Port to 3001"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Stash local changes and pull
echo ""
echo "Step 1: Stashing local changes and pulling latest..."
git stash
git pull

# Step 2: Update .env file
echo ""
echo "Step 2: Updating .env file..."
if [ -f .env ]; then
    if grep -q "^PORT=" .env; then
        sed -i 's/^PORT=.*/PORT=3001/' .env
    else
        echo "PORT=3001" >> .env
    fi
    echo "✓ Updated .env: PORT=3001"
else
    echo "PORT=3001" > .env
    echo "✓ Created .env with PORT=3001"
fi

# Step 3: Stop PM2 processes
echo ""
echo "Step 3: Stopping PM2 processes..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sleep 2

# Step 4: Check port 3001
echo ""
echo "Step 4: Checking port 3001..."
if command -v lsof &> /dev/null; then
    if lsof -ti:3001 >/dev/null 2>&1; then
        echo "⚠️  Port 3001 is in use. Killing process..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null
        sleep 2
    fi
    echo "✓ Port 3001 is free"
fi

# Step 5: Start backend
echo ""
echo "Step 5: Starting backend on port 3001..."
pm2 start ecosystem.config.js
sleep 3

# Step 6: Check status
echo ""
echo "Step 6: Checking status..."
pm2 status

# Step 7: Test backend
echo ""
echo "Step 7: Testing backend..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✓ Backend is responding on port 3001!"
    curl http://localhost:3001/api/health
else
    echo "✗ Backend not responding. Check logs: pm2 logs amast-crm-backend"
fi

# Step 8: Update Nginx
echo ""
echo "Step 8: Updating Nginx configuration..."
if [ -f /etc/nginx/sites-available/amast-crm ]; then
    sudo sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/amast-crm
    if sudo nginx -t; then
        sudo systemctl restart nginx
        echo "✓ Nginx updated and restarted"
    else
        echo "✗ Nginx config test failed"
    fi
else
    echo "⚠️  Nginx config not found. Update manually:"
    echo "  Change 'localhost:3000' to 'localhost:3001' in /etc/nginx/sites-available/amast-crm"
fi

# Step 9: Save PM2
echo ""
echo "Step 9: Saving PM2 configuration..."
pm2 save

echo ""
echo "=========================================="
echo "✓ Complete!"
echo "=========================================="
echo ""
echo "Backend: Port 3001 (PM2)"
echo "Grafana: Port 3000 (unchanged)"
echo "Frontend: Port 80 (Nginx)"
echo ""

