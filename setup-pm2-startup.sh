#!/bin/bash

echo "=========================================="
echo "Setting up PM2 Auto-Start on Boot"
echo "=========================================="

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Please install it first:"
    echo "  npm install -g pm2"
    exit 1
fi

# Check if backend is running
echo ""
echo "Checking PM2 status..."
pm2 list

# Generate startup script
echo ""
echo "Generating PM2 startup script..."
STARTUP_CMD=$(pm2 startup)

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Run the command above as root/sudo:"
    echo "=========================================="
    echo ""
    echo "$STARTUP_CMD"
    echo ""
    echo "After running that command, come back and run:"
    echo "  pm2 save"
    echo ""
    echo "This will ensure PM2 starts automatically on boot."
    echo ""
else
    echo "✗ Failed to generate startup script"
    exit 1
fi

