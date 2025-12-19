#!/bin/bash

echo "=========================================="
echo "Final CORS Fix"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Update .env with CORS_ORIGIN
echo ""
echo "Step 1: Updating .env file..."
if [ -f .env ]; then
    # Remove old CORS_ORIGIN if exists
    sed -i '/^CORS_ORIGIN=/d' .env
    
    # Add new CORS_ORIGIN
    echo "CORS_ORIGIN=http://47.250.126.192,https://tmybaiki.amastsales-sandbox.com,http://tmybaiki.amastsales-sandbox.com" >> .env
    echo "✓ Updated CORS_ORIGIN in .env"
    echo "Current CORS_ORIGIN:"
    grep CORS_ORIGIN .env
else
    echo "Creating .env file..."
    echo "CORS_ORIGIN=http://47.250.126.192,https://tmybaiki.amastsales-sandbox.com,http://tmybaiki.amastsales-sandbox.com" > .env
    echo "✓ Created .env"
fi

# Step 2: Pull latest code (to get updated server.js)
echo ""
echo "Step 2: Pulling latest code..."
git pull

# Step 3: Restart backend with --update-env to pick up new env vars
echo ""
echo "Step 3: Restarting backend with updated environment..."
pm2 restart amast-crm-backend --update-env
sleep 5

# Step 4: Check backend logs
echo ""
echo "Step 4: Checking backend logs for CORS configuration..."
pm2 logs amast-crm-backend --lines 20 --nostream | grep -i cors || echo "No CORS logs found (this is OK)"

# Step 5: Test CORS headers
echo ""
echo "Step 5: Testing CORS headers..."
echo "Testing OPTIONS request (preflight):"
curl -X OPTIONS -H "Origin: http://47.250.126.192" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v http://localhost:3001/api/auth/login 2>&1 | grep -i "access-control" || echo "No CORS headers in response"

echo ""
echo "Testing GET request:"
curl -H "Origin: http://47.250.126.192" \
     -v http://localhost:3001/health 2>&1 | grep -i "access-control" || echo "No CORS headers in response"

# Step 6: Restart Nginx
echo ""
echo "Step 6: Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo "=========================================="
echo "✓ CORS Fix Complete!"
echo "=========================================="
echo ""
echo "If CORS errors persist, check:"
echo "1. Backend logs: pm2 logs amast-crm-backend"
echo "2. Verify .env has CORS_ORIGIN set correctly"
echo "3. Make sure you're accessing the site from one of the allowed origins"
echo ""

