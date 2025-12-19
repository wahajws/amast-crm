#!/bin/bash

echo "=========================================="
echo "Update Nginx Timeouts for Bulk Import"
echo "=========================================="
echo ""

cd /opt/amast-crm/amast-crm || exit 1

# Pull latest code
echo "Step 1: Pulling latest code..."
git pull

if [ $? -ne 0 ]; then
    echo "✗ Failed to pull latest code"
    exit 1
fi

echo "✓ Code updated"
echo ""

# Copy Nginx config
echo "Step 2: Updating Nginx configuration..."
sudo cp nginx/amast-crm.conf /etc/nginx/sites-available/amast-crm

if [ $? -ne 0 ]; then
    echo "✗ Failed to copy Nginx config"
    exit 1
fi

echo "✓ Nginx config copied"
echo ""

# Test Nginx configuration
echo "Step 3: Testing Nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "✗ Nginx configuration test failed"
    echo "Please check the configuration manually"
    exit 1
fi

echo "✓ Nginx configuration is valid"
echo ""

# Reload Nginx
echo "Step 4: Reloading Nginx..."
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✓ Nginx reloaded successfully"
    echo ""
    echo "New timeout settings:"
    echo "  - Bulk import / Lead generation: 15 minutes (900s)"
    echo "  - General API endpoints: 5 minutes (300s)"
    echo ""
    echo "The 504 Gateway Timeout error should now be resolved!"
else
    echo "✗ Failed to reload Nginx"
    echo "Try: sudo systemctl restart nginx"
    exit 1
fi

