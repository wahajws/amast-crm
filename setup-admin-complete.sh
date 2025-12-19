#!/bin/bash

echo "=========================================="
echo "Complete Admin Setup"
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

# Export for mysql command (to avoid command line warning)
export MYSQL_PWD="$MYSQL_PASSWORD"

# Step 1: Check if roles exist
echo ""
echo "Step 1: Checking if roles exist..."
ROLE_COUNT=$(mysql -u root crm_system -sN -e "SELECT COUNT(*) FROM roles;" 2>/dev/null)

if [ "$ROLE_COUNT" = "0" ] || [ -z "$ROLE_COUNT" ]; then
    echo "⚠️  No roles found. Running seed script..."
    npm run seed
    if [ $? -ne 0 ]; then
        echo "✗ Seed script failed"
        exit 1
    fi
    echo "✓ Roles created"
else
    echo "✓ Roles exist ($ROLE_COUNT roles found)"
fi

# Step 2: Verify SUPER_ADMIN role exists
echo ""
echo "Step 2: Verifying SUPER_ADMIN role..."
ROLE_ID=$(mysql -u root crm_system -sN -e "SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;" 2>/dev/null)

if [ -z "$ROLE_ID" ]; then
    echo "⚠️  SUPER_ADMIN role not found!"
    echo "Creating SUPER_ADMIN role manually..."
    mysql -u root crm_system <<EOF
INSERT INTO roles (name, display_name, description, is_system_role, created_at, updated_at)
VALUES ('SUPER_ADMIN', 'Super Admin', 'Super Administrator with full system access', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;
EOF
    ROLE_ID=$(mysql -u root crm_system -sN -e "SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;" 2>/dev/null)
    
    if [ -z "$ROLE_ID" ]; then
        echo "✗ Failed to create SUPER_ADMIN role"
        exit 1
    fi
    echo "✓ SUPER_ADMIN role created (ID: $ROLE_ID)"
else
    echo "✓ SUPER_ADMIN role found (ID: $ROLE_ID)"
fi

# Step 3: Hash password
echo ""
echo "Step 3: Hashing password..."
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => console.log(hash)).catch(err => { console.error(err); process.exit(1); });")

if [ -z "$HASHED_PASSWORD" ]; then
    echo "✗ Failed to hash password"
    exit 1
fi
echo "✓ Password hashed"

# Step 4: Check if admin exists
echo ""
echo "Step 4: Checking if admin user exists..."
ADMIN_EXISTS=$(mysql -u root crm_system -sN -e "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" 2>/dev/null)

if [ "$ADMIN_EXISTS" = "1" ]; then
    echo "✓ Admin user exists"
    echo ""
    echo "Updating password and status..."
    mysql -u root crm_system <<EOF
UPDATE users 
SET password_hash = '$HASHED_PASSWORD',
    status = 'ACTIVE',
    role_id = $ROLE_ID,
    updated_at = NOW()
WHERE email = '$ADMIN_EMAIL';
EOF
    if [ $? -eq 0 ]; then
        echo "✓ Admin user updated"
    else
        echo "✗ Failed to update admin user"
        exit 1
    fi
else
    echo "⚠️  Admin user does not exist"
    echo ""
    echo "Creating admin user..."
    
    mysql -u root crm_system <<EOF
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

# Step 5: Verify
echo ""
echo "Step 5: Verifying admin user..."
mysql -u root crm_system -e "SELECT id, email, first_name, last_name, status, role_id FROM users WHERE email = '$ADMIN_EMAIL';" 2>/dev/null

# Unset password
unset MYSQL_PWD

# Step 6: Test login
echo ""
echo "Step 6: Testing login..."
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

