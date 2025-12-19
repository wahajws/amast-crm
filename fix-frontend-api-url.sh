#!/bin/bash

echo "=========================================="
echo "Fixing Frontend API URL"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Update frontend .env.production to use relative path
echo ""
echo "Step 1: Updating frontend .env.production..."
cd frontend

# Use relative path so it works with any origin
if [ -f .env.production ]; then
    sed -i 's|^VITE_API_URL=.*|VITE_API_URL=/api|' .env.production
else
    echo "VITE_API_URL=/api" > .env.production
fi
echo "✓ Updated .env.production: VITE_API_URL=/api"
echo "  (Using relative path - will work with any origin)"

# Step 2: Rebuild frontend
echo ""
echo "Step 2: Rebuilding frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ Frontend rebuilt successfully"
else
    echo "✗ Frontend build failed"
    exit 1
fi
cd ..

# Step 3: Restart Nginx
echo ""
echo "Step 3: Restarting Nginx..."
sudo systemctl restart nginx
echo "✓ Nginx restarted"

echo ""
echo "=========================================="
echo "✓ Frontend API URL Fixed!"
echo "=========================================="
echo ""
echo "Frontend now uses relative API URL: /api"
echo "This means:"
echo "  - Access from http://47.250.126.192 → API calls go to http://47.250.126.192/api"
echo "  - Access from https://tmybaiki.amastsales-sandbox.com → API calls go to https://tmybaiki.amastsales-sandbox.com/api"
echo ""
echo "Clear browser cache and try again!"
echo ""

