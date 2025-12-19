#!/bin/bash

echo "=========================================="
echo "Starting AMAST CRM Backend with PM2"
echo "=========================================="

# Navigate to project directory
cd /opt/amast-crm/amast-crm || exit 1

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "✗ Failed to install PM2"
        exit 1
    fi
    echo "✓ PM2 installed successfully"
fi

# Create logs directory
mkdir -p logs

# Stop existing process if running
echo ""
echo "Stopping existing process (if any)..."
pm2 delete amast-crm-backend 2>/dev/null

# Start the application
echo ""
echo "Starting backend with PM2..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✓ Backend started successfully"
    
    # Save PM2 configuration
    echo ""
    echo "Saving PM2 configuration..."
    pm2 save
    
    echo ""
    echo "=========================================="
    echo "✓ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Useful commands:"
    echo "  View status:    pm2 status"
    echo "  View logs:      pm2 logs amast-crm-backend"
    echo "  Restart:        pm2 restart amast-crm-backend"
    echo "  Stop:           pm2 stop amast-crm-backend"
    echo "  Monitor:        pm2 monit"
    echo ""
    echo "To setup auto-start on boot, run:"
    echo "  pm2 startup"
    echo ""
else
    echo "✗ Failed to start backend"
    echo "Check logs: pm2 logs amast-crm-backend"
    exit 1
fi

