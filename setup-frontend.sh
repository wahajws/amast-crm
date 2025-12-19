#!/bin/bash

echo "=========================================="
echo "Frontend Setup for AMAST CRM"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "✗ Frontend directory not found"
    exit 1
fi

cd frontend

# Install dependencies
echo ""
echo "Installing frontend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Get API URL
echo ""
read -p "Enter your API URL (e.g., http://47.250.126.192/api or http://your-domain.com/api): " API_URL
if [ -z "$API_URL" ]; then
    API_URL="http://47.250.126.192/api"
fi

# Create .env.production
echo ""
echo "Creating .env.production file..."
cat > .env.production <<ENVFILE
VITE_API_URL=$API_URL
ENVFILE
echo "✓ Created .env.production with API_URL=$API_URL"

# Build frontend
echo ""
echo "Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Frontend Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Build output: frontend/dist/"
    echo "API URL configured: $API_URL"
    echo ""
    echo "Next steps:"
    echo "1. Make sure Nginx is configured (see NGINX_SETUP.md)"
    echo "2. Restart Nginx: sudo systemctl restart nginx"
    echo "3. Access your app at: http://47.250.126.192"
    echo ""
else
    echo ""
    echo "✗ Frontend build failed"
    exit 1
fi

