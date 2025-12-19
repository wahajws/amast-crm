# Server Deployment Guide

## Prerequisites
- SSH access to server (47.250.126.192)
- MySQL installed and running
- Node.js installed (v18+)
- Git installed

## Step 1: Connect to Server

### Using PuTTY (Windows):
1. Open PuTTY
2. Enter Host: `47.250.126.192`
3. Go to Connection > SSH > Auth
4. Browse and select `Public-Environment.ppk`
5. Click Open
6. Login as: `root`

### Using SSH (Linux/Mac):
```bash
# Convert PPK to OpenSSH format first (if needed)
puttygen Public-Environment.ppk -O private-openssh -o id_rsa
chmod 600 id_rsa
ssh -i id_rsa root@47.250.126.192
```

## Step 2: Database Setup

Once connected to the server, run these commands:

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create a database user (optional but recommended)
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 3: Setup Application

```bash
# Navigate to application directory
cd /opt/amast-crm/amast-crm

# Install dependencies (if not already done)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 4: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following (update with your actual values):

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_system

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here

# Alibaba Qwen LLM
ALIBABA_LLM_API_KEY=sk-65507ea4e9884c378d635a38d0bb2a6f
ALIBABA_LLM_API_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
ALIBABA_LLM_API_MODEL=qwen-plus

# Serper API (Optional)
SERPER_API_KEY=your_serper_api_key

# Google Custom Search (Optional)
GOOGLE_CSE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_cse_id

# Server
PORT=3000
NODE_ENV=production

# Frontend URL (update with your domain)
FRONTEND_URL=http://your-domain.com
```

## Step 5: Run Database Migrations

```bash
# Run migrations to create all tables
npm run migrate

# Or if that doesn't work, run manually:
node utils/runMigrations.js
```

## Step 6: Start the Application

### Option 1: Direct Start (for testing)
```bash
npm start
```

### Option 2: Using PM2 (Recommended for production)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "amast-crm"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Step 7: Setup Frontend (Production Build)

```bash
cd frontend

# Build for production
npm run build

# The build output will be in frontend/dist/
```

### Option A: Serve with Nginx (Recommended)
```bash
# Install Nginx
apt-get update
apt-get install nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/amast-crm
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/amast-crm/amast-crm/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/amast-crm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `systemctl status mysql`
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Verify credentials in `.env` file

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000
# Kill the process or change PORT in .env
```

### Permission Issues
```bash
# Make sure files have correct permissions
chown -R root:root /opt/amast-crm/amast-crm
chmod -R 755 /opt/amast-crm/amast-crm
```

## Quick Setup Script

Save this as `setup-server.sh` and run it:

```bash
#!/bin/bash
# Database setup
mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# Run migrations
cd /opt/amast-crm/amast-crm
npm run migrate

echo "Setup complete! Make sure to configure .env file before starting."
```

