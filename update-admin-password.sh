#!/bin/bash

echo "=========================================="
echo "Update Admin Password"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Get password from .env
ADMIN_EMAIL=$(grep '^DEFAULT_ADMIN_EMAIL=' .env 2>/dev/null | cut -d'=' -f2 || echo 'admin@crm.local')
ADMIN_PASSWORD=$(grep '^DEFAULT_ADMIN_PASSWORD=' .env 2>/dev/null | cut -d'=' -f2 || echo 'ChangeMe123!')

echo "Updating password for: $ADMIN_EMAIL"
echo ""

# Hash the password
echo "Hashing password..."
HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => console.log(hash));")

if [ -z "$HASH" ]; then
    echo "✗ Failed to hash password"
    exit 1
fi

echo "✓ Password hashed"
echo ""

# Get MySQL password
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

# Update password
export MYSQL_PWD="$MYSQL_PASSWORD"
mysql -u root crm_system <<EOF
UPDATE users 
SET password_hash = '$HASH',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE email = '$ADMIN_EMAIL';
EOF

if [ $? -eq 0 ]; then
    echo "✓ Password updated successfully!"
    echo ""
    echo "You can now login with:"
    echo "  Email: $ADMIN_EMAIL"
    echo "  Password: $ADMIN_PASSWORD"
    echo ""
    
    # Test login
    echo "Testing login..."
    sleep 2
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        echo "✓ Login test successful!"
    else
        echo "⚠️  Login test failed. Response:"
        echo "$RESPONSE" | head -3
    fi
else
    echo "✗ Failed to update password"
    exit 1
fi

unset MYSQL_PWD

