#!/bin/bash

echo "=========================================="
echo "Building AMAST CRM Frontend"
echo "=========================================="

cd /opt/amast-crm/amast-crm/frontend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ Failed to install dependencies"
        exit 1
    fi
fi

# Build frontend
echo ""
echo "Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Frontend build complete!"
    echo "=========================================="
    echo ""
    echo "Build output: frontend/dist/"
    echo ""
    echo "Nginx will serve these static files."
    echo "If Nginx is already configured, restart it:"
    echo "  sudo systemctl restart nginx"
    echo ""
else
    echo ""
    echo "✗ Frontend build failed"
    exit 1
fi

