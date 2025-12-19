#!/bin/bash

echo "=========================================="
echo "Final Nginx Setup for AMAST CRM"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Copy Nginx config
echo ""
echo "Step 1: Copying Nginx configuration..."
if [ ! -f nginx/amast-crm.conf ]; then
    echo "✗ Nginx config template not found!"
    exit 1
fi

sudo cp nginx/amast-crm.conf /etc/nginx/sites-available/amast-crm
echo "✓ Config copied"

# Step 2: Update server_name
echo ""
echo "Step 2: Updating server_name..."
read -p "Enter your domain (or press Enter for tmybaiki.amastsales-sandbox.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="tmybaiki.amastsales-sandbox.com"
fi

sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/amast-crm
sudo sed -i "s/www.your-domain.com/www.$DOMAIN/g" /etc/nginx/sites-available/amast-crm
echo "✓ Server name set to: $DOMAIN"

# Step 3: Verify port 3001 is set
echo ""
echo "Step 3: Verifying backend port..."
if grep -q "localhost:3001" /etc/nginx/sites-available/amast-crm; then
    echo "✓ Backend port is 3001"
else
    echo "⚠️  Updating backend port to 3001..."
    sudo sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/amast-crm
    echo "✓ Backend port updated to 3001"
fi

# Step 4: Enable site
echo ""
echo "Step 4: Enabling Nginx site..."
if [ -L /etc/nginx/sites-enabled/amast-crm ]; then
    echo "✓ Site already enabled"
else
    sudo ln -s /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/
    echo "✓ Site enabled"
fi

# Remove default site if it exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "⚠️  Removing default Nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
    echo "✓ Default site removed"
fi

# Step 5: Test Nginx config
echo ""
echo "Step 5: Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration test failed!"
    exit 1
fi

# Step 6: Restart Nginx
echo ""
echo "Step 6: Restarting Nginx..."
sudo systemctl restart nginx
if [ $? -eq 0 ]; then
    echo "✓ Nginx restarted successfully"
else
    echo "✗ Failed to restart Nginx"
    exit 1
fi

# Step 7: Verify frontend path
echo ""
echo "Step 7: Verifying frontend path..."
FRONTEND_PATH="/opt/amast-crm/amast-crm/frontend/dist"
if [ -d "$FRONTEND_PATH" ] && [ -f "$FRONTEND_PATH/index.html" ]; then
    echo "✓ Frontend files found at: $FRONTEND_PATH"
else
    echo "⚠️  Frontend not built. Building now..."
    cd frontend
    npm run build
    cd ..
    echo "✓ Frontend built"
fi

# Step 8: Test endpoints
echo ""
echo "Step 8: Testing endpoints..."
sleep 2

echo ""
echo "Testing backend directly:"
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✓ Backend health endpoint working"
    curl -s http://localhost:3001/health | head -3
else
    echo "✗ Backend health endpoint not working"
fi

echo ""
echo "Testing through Nginx:"
if curl -s http://localhost/health > /dev/null; then
    echo "✓ Health endpoint accessible through Nginx"
    curl -s http://localhost/health | head -3
else
    echo "⚠️  Health endpoint not accessible through Nginx"
fi

echo ""
echo "Testing frontend:"
if curl -s http://localhost/ | grep -q "html\|<!DOCTYPE" 2>/dev/null; then
    echo "✓ Frontend accessible through Nginx"
else
    echo "⚠️  Frontend may not be accessible"
fi

echo ""
echo "=========================================="
echo "✓ Nginx Setup Complete!"
echo "=========================================="
echo ""
echo "Your application should be accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Backend: Port 3001 (PM2)"
echo "Frontend: Port 80 (Nginx)"
echo ""
echo "If you see 301 redirects, check SSL configuration."
echo ""

