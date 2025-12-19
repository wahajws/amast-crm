#!/bin/bash

echo "=========================================="
echo "Verifying AMAST CRM Deployment"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Check backend
echo ""
echo "1. Backend Status (PM2):"
pm2 status

# Check backend health
echo ""
echo "2. Backend Health Check:"
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ Backend responding on port 3001"
    curl -s http://localhost:3001/api/health | head -5
else
    echo "✗ Backend not responding on port 3001"
fi

# Check frontend build
echo ""
echo "3. Frontend Build:"
if [ -d "frontend/dist" ] && [ -f "frontend/dist/index.html" ]; then
    echo "✓ Frontend built (dist folder exists)"
    echo "  Files in dist: $(ls frontend/dist | wc -l)"
else
    echo "✗ Frontend not built. Run: cd frontend && npm run build"
fi

# Check Nginx config
echo ""
echo "4. Nginx Configuration:"
if [ -f /etc/nginx/sites-available/amast-crm ]; then
    echo "✓ Nginx config file exists"
    
    # Check if it points to correct port
    if grep -q "localhost:3001" /etc/nginx/sites-available/amast-crm; then
        echo "✓ Nginx configured for port 3001"
    elif grep -q "localhost:3000" /etc/nginx/sites-available/amast-crm; then
        echo "⚠️  Nginx still points to port 3000. Updating..."
        sudo sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/amast-crm
        if sudo nginx -t; then
            sudo systemctl restart nginx
            echo "✓ Nginx updated and restarted"
        else
            echo "✗ Nginx config test failed"
        fi
    else
        echo "⚠️  Could not find backend port in Nginx config"
    fi
    
    # Check if site is enabled
    if [ -L /etc/nginx/sites-enabled/amast-crm ]; then
        echo "✓ Nginx site is enabled"
    else
        echo "⚠️  Nginx site not enabled. Run:"
        echo "  sudo ln -s /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/"
    fi
else
    echo "✗ Nginx config not found at /etc/nginx/sites-available/amast-crm"
    echo "  Copy from: nginx/amast-crm.conf"
fi

# Check Nginx status
echo ""
echo "5. Nginx Service Status:"
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx is not running. Start with: sudo systemctl start nginx"
fi

# Test through Nginx
echo ""
echo "6. Testing through Nginx:"
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo "✓ API accessible through Nginx"
    curl -s http://localhost/api/health | head -5
else
    echo "✗ API not accessible through Nginx"
fi

# Check frontend through Nginx
echo ""
echo "7. Testing Frontend through Nginx:"
if curl -s http://localhost/ | grep -q "html\|<!DOCTYPE" 2>/dev/null; then
    echo "✓ Frontend accessible through Nginx"
else
    echo "⚠️  Frontend may not be accessible. Check Nginx root path"
fi

echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="
echo "Backend: $(pm2 jlist | grep -q '"status":"online"' && echo '✓ Running' || echo '✗ Not running')"
echo "Frontend Build: $([ -d frontend/dist ] && echo '✓ Built' || echo '✗ Not built')"
echo "Nginx: $(systemctl is-active --quiet nginx && echo '✓ Running' || echo '✗ Not running')"
echo ""

