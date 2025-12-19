#!/bin/bash

echo "=========================================="
echo "Fixing CORS Configuration"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Update .env file
echo ""
echo "Step 1: Updating CORS_ORIGIN in .env..."
if [ -f .env ]; then
    # Backup .env
    cp .env .env.backup
    
    # Update or add CORS_ORIGIN
    if grep -q "^CORS_ORIGIN=" .env; then
        sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=http://47.250.126.192,https://tmybaiki.amastsales-sandbox.com,http://tmybaiki.amastsales-sandbox.com|' .env
    else
        echo "CORS_ORIGIN=http://47.250.126.192,https://tmybaiki.amastsales-sandbox.com,http://tmybaiki.amastsales-sandbox.com" >> .env
    fi
    echo "✓ Updated CORS_ORIGIN in .env"
else
    echo "⚠️  .env file not found. Creating one..."
    echo "CORS_ORIGIN=http://47.250.126.192,https://tmybaiki.amastsales-sandbox.com,http://tmybaiki.amastsales-sandbox.com" > .env
    echo "✓ Created .env with CORS_ORIGIN"
fi

# Step 2: Update frontend .env.production
echo ""
echo "Step 2: Updating frontend API URL..."
cd frontend
if [ -f .env.production ]; then
    sed -i 's|^VITE_API_URL=.*|VITE_API_URL=https://tmybaiki.amastsales-sandbox.com/api|' .env.production
else
    echo "VITE_API_URL=https://tmybaiki.amastsales-sandbox.com/api" > .env.production
fi
echo "✓ Updated frontend .env.production"

# Step 3: Rebuild frontend
echo ""
echo "Step 3: Rebuilding frontend with new API URL..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Frontend rebuilt successfully"
else
    echo "✗ Frontend build failed"
    exit 1
fi
cd ..

# Step 4: Restart backend
echo ""
echo "Step 4: Restarting backend to apply CORS changes..."
pm2 restart amast-crm-backend
sleep 3

# Step 5: Verify
echo ""
echo "Step 5: Verifying setup..."
echo "Backend status:"
pm2 status

echo ""
echo "Testing backend health:"
curl -s http://localhost:3001/health | head -3

echo ""
echo "=========================================="
echo "✓ CORS Configuration Updated!"
echo "=========================================="
echo ""
echo "CORS now allows:"
echo "  - http://47.250.126.192"
echo "  - https://tmybaiki.amastsales-sandbox.com"
echo "  - http://tmybaiki.amastsales-sandbox.com"
echo ""
echo "Frontend API URL: https://tmybaiki.amastsales-sandbox.com/api"
echo ""
echo "Restart Nginx to serve new frontend build:"
echo "  sudo systemctl restart nginx"
echo ""

