#!/bin/bash

echo "=========================================="
echo "Ensuring Admin User Exists"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Get credentials from .env
ADMIN_EMAIL=$(grep '^DEFAULT_ADMIN_EMAIL=' .env 2>/dev/null | cut -d'=' -f2 || echo 'admin@crm.local')
ADMIN_PASSWORD=$(grep '^DEFAULT_ADMIN_PASSWORD=' .env 2>/dev/null | cut -d'=' -f2 || echo 'ChangeMe123!')
ADMIN_FIRST_NAME=$(grep '^DEFAULT_ADMIN_FIRST_NAME=' .env 2>/dev/null | cut -d'=' -f2 || echo 'Admin')
ADMIN_LAST_NAME=$(grep '^DEFAULT_ADMIN_LAST_NAME=' .env 2>/dev/null | cut -d'=' -f2 || echo 'User')

echo "Using credentials:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""

# Get MySQL password
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

# Hash the password using Node.js
echo ""
echo "Hashing password..."
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => console.log(hash)).catch(err => { console.error(err); process.exit(1); });")

if [ -z "$HASHED_PASSWORD" ]; then
    echo "✗ Failed to hash password"
    exit 1
fi

echo "✓ Password hashed"

# Check if admin exists
echo ""
echo "Checking if admin user exists..."
ADMIN_EXISTS=$(mysql -u root -p$MYSQL_PASSWORD crm_system -sN -e "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" 2>/dev/null)

if [ "$ADMIN_EXISTS" = "1" ]; then
    echo "✓ Admin user exists"
    echo ""
    echo "Updating password..."
    mysql -u root -p$MYSQL_PASSWORD crm_system <<EOF
UPDATE users 
SET password_hash = '$HASHED_PASSWORD',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE email = '$ADMIN_EMAIL';
EOF
    if [ $? -eq 0 ]; then
        echo "✓ Password updated"
    else
        echo "✗ Failed to update password"
        exit 1
    fi
else
    echo "⚠️  Admin user does not exist"
    echo ""
    echo "Creating admin user..."
    
    # Get SUPER_ADMIN role ID
    ROLE_ID=$(mysql -u root -p$MYSQL_PASSWORD crm_system -sN -e "SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;" 2>/dev/null)
    
    if [ -z "$ROLE_ID" ]; then
        echo "✗ SUPER_ADMIN role not found!"
        echo "Please run: npm run seed"
        exit 1
    fi
    
    echo "✓ Found SUPER_ADMIN role (ID: $ROLE_ID)"
    
    # Create admin user
    mysql -u root -p$MYSQL_PASSWORD crm_system <<EOF
INSERT INTO users (email, password_hash, first_name, last_name, role_id, status, created_at, updated_at)
VALUES ('$ADMIN_EMAIL', '$HASHED_PASSWORD', '$ADMIN_FIRST_NAME', '$ADMIN_LAST_NAME', $ROLE_ID, 'ACTIVE', NOW(), NOW());
EOF
    
    if [ $? -eq 0 ]; then
        echo "✓ Admin user created"
    else
        echo "✗ Failed to create admin user"
        exit 1
    fi
fi

# Verify
echo ""
echo "Verifying admin user..."
mysql -u root -p$MYSQL_PASSWORD crm_system -e "SELECT id, email, first_name, last_name, status FROM users WHERE email = '$ADMIN_EMAIL';" 2>/dev/null

# Test login
echo ""
echo "Testing login..."
sleep 2
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✓ Login successful!"
    echo ""
    echo "You can now login with:"
    echo "  Email: $ADMIN_EMAIL"
    echo "  Password: $ADMIN_PASSWORD"
else
    echo "⚠️  Login test failed. Response:"
    echo "$RESPONSE" | head -5
    echo ""
    echo "Check backend logs: pm2 logs amast-crm-backend"
fi

echo ""
echo "=========================================="
echo "✓ Complete!"
echo "=========================================="

