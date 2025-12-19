#!/bin/bash

echo "=========================================="
echo "AMAST CRM Server Setup"
echo "=========================================="

# Get MySQL root password
echo ""
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

# Create database
echo ""
echo "Creating database..."
mysql -u root -p$MYSQL_ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES LIKE 'crm_system';
EOF

if [ $? -eq 0 ]; then
    echo "✓ Database 'crm_system' created successfully"
else
    echo "✗ Failed to create database. Please check MySQL password."
    exit 1
fi

# Check if .env exists
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env <<ENVFILE
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=$MYSQL_ROOT_PASSWORD
DB_NAME=crm_system

# JWT - Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Alibaba Qwen LLM
ALIBABA_LLM_API_KEY=sk-65507ea4e9884c378d635a38d0bb2a6f
ALIBABA_LLM_API_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
ALIBABA_LLM_API_MODEL=qwen-plus

# Server
PORT=3000
NODE_ENV=production
ENVFILE
    echo "✓ .env file created"
    echo "⚠️  Please add your SERPER_API_KEY and GOOGLE_CSE credentials if needed"
else
    echo "✓ .env file already exists"
    echo "⚠️  Make sure DB_PASSWORD in .env matches your MySQL root password"
fi

# Run migrations
echo ""
echo "Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Review and update .env file if needed"
    echo "2. Start the server: npm start"
    echo "3. Or use PM2: pm2 start server.js --name amast-crm"
    echo ""
else
    echo ""
    echo "✗ Migrations failed. Please check the error above."
    exit 1
fi

