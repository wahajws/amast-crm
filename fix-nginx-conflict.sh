#!/bin/bash

echo "=========================================="
echo "Fixing Nginx Server Name Conflict"
echo "=========================================="

# Check for conflicting server blocks
echo ""
echo "Checking for conflicting Nginx configurations..."
CONFLICTS=$(sudo grep -r "server_name.*tmybaiki.amastsales-sandbox.com" /etc/nginx/sites-enabled/ 2>/dev/null | wc -l)

if [ "$CONFLICTS" -gt 1 ]; then
    echo "⚠️  Found $CONFLICTS server blocks with the same server_name"
    echo ""
    echo "Conflicting files:"
    sudo grep -r "server_name.*tmybaiki.amastsales-sandbox.com" /etc/nginx/sites-enabled/ -l
    
    echo ""
    echo "Listing all enabled sites:"
    ls -la /etc/nginx/sites-enabled/
    
    echo ""
    read -p "Remove duplicate/default configs? (y/n) [y]: " REMOVE
    if [ "$REMOVE" != "n" ] && [ "$REMOVE" != "N" ]; then
        # Remove default site if it exists
        if [ -L /etc/nginx/sites-enabled/default ]; then
            sudo rm /etc/nginx/sites-enabled/default
            echo "✓ Removed default site"
        fi
        
        # Check for other amast-crm configs
        for file in /etc/nginx/sites-enabled/*; do
            if [ -L "$file" ] && [ "$file" != "/etc/nginx/sites-enabled/amast-crm" ]; then
                if grep -q "tmybaiki.amastsales-sandbox.com" "$file" 2>/dev/null; then
                    echo "Removing duplicate: $file"
                    sudo rm "$file"
                fi
            fi
        done
    fi
else
    echo "✓ No conflicts found"
fi

# Verify amast-crm config
echo ""
echo "Verifying amast-crm configuration..."
if [ -L /etc/nginx/sites-enabled/amast-crm ]; then
    echo "✓ amast-crm site is enabled"
    
    # Check if it points to correct port
    if grep -q "localhost:3001" /etc/nginx/sites-available/amast-crm; then
        echo "✓ Backend port is 3001"
    else
        echo "⚠️  Backend port might be wrong. Updating..."
        sudo sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/amast-crm
        echo "✓ Updated to port 3001"
    fi
    
    # Check server_name
    if grep -q "tmybaiki.amastsales-sandbox.com" /etc/nginx/sites-available/amast-crm; then
        echo "✓ Server name is correct"
    else
        echo "⚠️  Server name might be wrong"
    fi
else
    echo "✗ amast-crm site is not enabled"
    echo "Enabling..."
    sudo ln -s /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/
    echo "✓ Enabled"
fi

# Test Nginx config
echo ""
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✓ Nginx configuration is valid"
    
    # Restart Nginx
    echo ""
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    echo "✓ Nginx restarted"
else
    echo "✗ Nginx configuration test failed!"
    exit 1
fi

# Test CORS through Nginx
echo ""
echo "Testing CORS through Nginx..."
sleep 2
curl -X OPTIONS \
  -H "Origin: http://47.250.126.192" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost/api/auth/login 2>&1 | grep -i "access-control\|HTTP/" | head -10

echo ""
echo "=========================================="
echo "✓ Nginx Conflict Fixed!"
echo "=========================================="
echo ""
echo "If CORS errors persist in browser:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Hard refresh (Ctrl+F5)"
echo "3. Try incognito/private window"
echo ""

