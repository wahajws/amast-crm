#!/bin/bash

echo "=========================================="
echo "Updating Backend Port (3000 -> 3001)"
echo "=========================================="
echo ""
echo "Grafana is using port 3000, so we'll use port 3001 for the backend."
echo ""

cd /opt/amast-crm/amast-crm || exit 1

# Update .env file
echo "Step 1: Updating .env file..."
if [ -f .env ]; then
    # Backup .env
    cp .env .env.backup
    
    # Update PORT in .env
    if grep -q "^PORT=" .env; then
        sed -i 's/^PORT=.*/PORT=3001/' .env
    else
        echo "PORT=3001" >> .env
    fi
    echo "✓ Updated .env: PORT=3001"
else
    echo "⚠️  .env file not found. Creating one..."
    echo "PORT=3001" > .env
    echo "✓ Created .env with PORT=3001"
fi

# Stop existing PM2 processes
echo ""
echo "Step 2: Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sleep 2

# Check if port 3001 is free
echo ""
echo "Step 3: Checking if port 3001 is free..."
if command -v lsof &> /dev/null; then
    if lsof -ti:3001 >/dev/null 2>&1; then
        echo "⚠️  Port 3001 is in use. Showing details:"
        lsof -i :3001
        echo ""
        read -p "Kill process on port 3001? (y/n) [n]: " KILL
        if [ "$KILL" = "y" ] || [ "$KILL" = "Y" ]; then
            lsof -ti:3001 | xargs kill -9 2>/dev/null
            sleep 2
            echo "✓ Port 3001 freed"
        else
            echo "⚠️  Port 3001 still in use. You may need to change it manually."
        fi
    else
        echo "✓ Port 3001 is free"
    fi
fi

# Start backend with new port
echo ""
echo "Step 4: Starting backend on port 3001..."
pm2 start ecosystem.config.js

# Wait a moment
sleep 3

# Check status
echo ""
echo "Step 5: Checking backend status..."
pm2 status

# Test backend
echo ""
echo "Step 6: Testing backend on port 3001..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✓ Backend is responding on port 3001!"
    curl http://localhost:3001/api/health
else
    echo "✗ Backend is not responding. Check logs:"
    echo "  pm2 logs amast-crm-backend"
fi

# Update Nginx config
echo ""
echo "Step 7: Updating Nginx configuration..."
if [ -f /etc/nginx/sites-available/amast-crm ]; then
    # Backup Nginx config
    sudo cp /etc/nginx/sites-available/amast-crm /etc/nginx/sites-available/amast-crm.backup
    
    # Update port in Nginx config
    sudo sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/amast-crm
    
    # Test Nginx config
    if sudo nginx -t; then
        echo "✓ Nginx configuration updated and tested"
        echo "Restarting Nginx..."
        sudo systemctl restart nginx
        echo "✓ Nginx restarted"
    else
        echo "✗ Nginx configuration test failed. Restoring backup..."
        sudo cp /etc/nginx/sites-available/amast-crm.backup /etc/nginx/sites-available/amast-crm
    fi
else
    echo "⚠️  Nginx config not found. Please update manually:"
    echo "  Change 'localhost:3000' to 'localhost:3001' in /etc/nginx/sites-available/amast-crm"
fi

# Save PM2 config
echo ""
echo "Step 8: Saving PM2 configuration..."
pm2 save

echo ""
echo "=========================================="
echo "✓ Port Update Complete!"
echo "=========================================="
echo ""
echo "Backend: Running on port 3001 (PM2)"
echo "Grafana: Still running on port 3000"
echo "Frontend: Served by Nginx on port 80"
echo ""
echo "Test backend: curl http://localhost:3001/api/health"
echo "Test through Nginx: curl http://localhost/api/health"
echo ""

