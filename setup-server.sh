#!/bin/bash

echo "=== AMAST CRM Server Setup ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Check MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "MySQL is not installed. Installing..."
    apt-get update
    apt-get install -y mysql-server
fi

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

echo "Step 1: Creating database..."
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

mysql -u root -p$MYSQL_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Database created successfully"
else
    echo "✗ Database creation failed. Please create manually."
    exit 1
fi

echo ""
echo "Step 2: Checking .env file..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cat > .env <<ENVFILE
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=$MYSQL_PASSWORD
DB_NAME=crm_system

# JWT
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
    echo "✓ .env file created. Please update with your API keys."
else
    echo "✓ .env file exists"
fi

echo ""
echo "Step 3: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "Step 4: Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migrations failed. Please check the error above."
    exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run 'npm start' to start the server"
echo "3. Or use PM2: 'pm2 start server.js --name amast-crm'"

