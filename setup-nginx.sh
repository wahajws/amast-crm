#!/bin/bash

echo "=========================================="
echo "Nginx Setup for AMAST CRM"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Nginx is not installed. Installing..."
    apt-get update
    apt-get install -y nginx
fi

# Navigate to project directory
cd /opt/amast-crm/amast-crm || exit 1

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ..

if [ ! -d "frontend/dist" ]; then
    echo "✗ Frontend build failed. Please check the error above."
    exit 1
fi
echo "✓ Frontend built successfully"

# Copy Nginx configuration
echo ""
echo "Setting up Nginx configuration..."
if [ ! -f "nginx/amast-crm.conf" ]; then
    echo "✗ Nginx config file not found at nginx/amast-crm.conf"
    exit 1
fi

cp nginx/amast-crm.conf /etc/nginx/sites-available/amast-crm

# Get server name/IP
read -p "Enter your domain name (or press Enter to use IP 47.250.126.192): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME="47.250.126.192"
fi

# Update server_name in config
sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/amast-crm
sed -i "s/www.your-domain.com/www.$DOMAIN_NAME/g" /etc/nginx/sites-available/amast-crm

# Enable site
echo ""
echo "Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/

# Remove default site
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "✓ Removed default Nginx site"
fi

# Test Nginx configuration
echo ""
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"
    
    # Restart Nginx
    echo ""
    echo "Restarting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    echo ""
    echo "=========================================="
    echo "✓ Nginx Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Your application should be accessible at:"
    echo "  http://$DOMAIN_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Make sure backend is running: pm2 status"
    echo "2. Update CORS_ORIGIN in .env file to: http://$DOMAIN_NAME"
    echo "3. Restart backend: pm2 restart amast-crm-backend"
    echo "4. Test API: curl http://$DOMAIN_NAME/api/health"
    echo ""
    echo "To view logs:"
    echo "  sudo tail -f /var/log/nginx/amast-crm-error.log"
    echo ""
else
    echo "✗ Nginx configuration test failed. Please check the error above."
    exit 1
fi

