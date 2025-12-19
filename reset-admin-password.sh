#!/bin/bash

echo "=========================================="
echo "Reset Admin Password"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Get new password
echo ""
read -sp "Enter new admin password (or press Enter for 'ChangeMe123!'): " NEW_PASSWORD
echo ""

if [ -z "$NEW_PASSWORD" ]; then
    NEW_PASSWORD="ChangeMe123!"
fi

# Get admin email
ADMIN_EMAIL=$(grep '^DEFAULT_ADMIN_EMAIL=' .env 2>/dev/null | cut -d'=' -f2 || echo 'admin@crm.local')

echo ""
echo "Resetting password for: $ADMIN_EMAIL"
echo ""

# Get MySQL password
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

# Hash the new password
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$NEW_PASSWORD', 10).then(hash => console.log(hash));")

if [ -z "$HASHED_PASSWORD" ]; then
    echo "✗ Failed to hash password"
    exit 1
fi

# Update password in database
mysql -u root -p$MYSQL_PASSWORD crm_system <<EOF
UPDATE users 
SET password_hash = '$HASHED_PASSWORD', 
    updated_at = NOW()
WHERE email = '$ADMIN_EMAIL';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Password updated successfully!"
    echo ""
    echo "New credentials:"
    echo "  Email: $ADMIN_EMAIL"
    echo "  Password: $NEW_PASSWORD"
    echo ""
else
    echo ""
    echo "✗ Failed to update password"
    exit 1
fi

