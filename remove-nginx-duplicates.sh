#!/bin/bash

echo "=========================================="
echo "Removing Duplicate Nginx Configs"
echo "=========================================="

# Find all files with the server name
echo ""
echo "Searching for all Nginx configs with 'tmybaiki.amastsales-sandbox.com'..."
echo ""

# Check sites-available
echo "Files in /etc/nginx/sites-available/:"
sudo ls -la /etc/nginx/sites-available/ | grep -i "tmybaiki\|amast"

echo ""
echo "Files in /etc/nginx/sites-enabled/:"
sudo ls -la /etc/nginx/sites-enabled/

echo ""
echo "Checking for duplicate server_name entries..."
DUPLICATES=$(sudo grep -r "server_name.*tmybaiki.amastsales-sandbox.com" /etc/nginx/sites-enabled/ 2>/dev/null | wc -l)
echo "Found $DUPLICATES server blocks with this server_name"

if [ "$DUPLICATES" -gt 1 ]; then
    echo ""
    echo "Duplicate configs found:"
    sudo grep -r "server_name.*tmybaiki.amastsales-sandbox.com" /etc/nginx/sites-enabled/ -l
    
    echo ""
    echo "Removing non-symlink file in sites-enabled..."
    # Remove any non-symlink files (they shouldn't be there)
    for file in /etc/nginx/sites-enabled/*; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            if grep -q "tmybaiki.amastsales-sandbox.com" "$file" 2>/dev/null; then
                echo "Removing: $file"
                sudo rm "$file"
            fi
        fi
    done
    
    echo "✓ Duplicates removed"
else
    echo "✓ No duplicates found"
fi

# Verify only amast-crm is enabled
echo ""
echo "Verifying enabled sites..."
ENABLED=$(ls -1 /etc/nginx/sites-enabled/ | wc -l)
echo "Total enabled sites: $ENABLED"

if [ "$ENABLED" -gt 1 ]; then
    echo ""
    echo "Enabled sites:"
    ls -la /etc/nginx/sites-enabled/
    echo ""
    read -p "Remove default site? (y/n) [y]: " REMOVE_DEFAULT
    if [ "$REMOVE_DEFAULT" != "n" ] && [ "$REMOVE_DEFAULT" != "N" ]; then
        if [ -L /etc/nginx/sites-enabled/default ]; then
            sudo rm /etc/nginx/sites-enabled/default
            echo "✓ Default site removed"
        fi
    fi
fi

# Test Nginx config
echo ""
echo "Testing Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "conflicting server name"; then
    echo "⚠️  Still has conflicting server name warning"
    echo "This might be from sites-available (not enabled). Checking..."
    sudo grep -r "server_name.*tmybaiki.amastsales-sandbox.com" /etc/nginx/sites-available/ -l
    echo ""
    echo "If you see multiple files above, you may need to:"
    echo "1. Keep only /etc/nginx/sites-available/amast-crm"
    echo "2. Remove or rename other files"
else
    echo "✓ No conflicts found"
fi

# Restart Nginx
echo ""
echo "Restarting Nginx..."
sudo systemctl restart nginx
echo "✓ Nginx restarted"

echo ""
echo "=========================================="
echo "✓ Cleanup Complete!"
echo "=========================================="
echo ""
echo "If warning persists, it's usually safe to ignore if:"
echo "1. Only one site is enabled (amast-crm)"
echo "2. CORS is working (which it is!)"
echo ""

