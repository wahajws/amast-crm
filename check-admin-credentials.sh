#!/bin/bash

echo "=========================================="
echo "Checking Admin Credentials"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Step 1: Check .env file
echo ""
echo "Step 1: Checking .env file for admin credentials..."
if [ -f .env ]; then
    echo "DEFAULT_ADMIN_EMAIL: $(grep '^DEFAULT_ADMIN_EMAIL=' .env | cut -d'=' -f2 || echo 'NOT SET (default: admin@crm.local)')"
    echo "DEFAULT_ADMIN_PASSWORD: $(grep '^DEFAULT_ADMIN_PASSWORD=' .env | cut -d'=' -f2 || echo 'NOT SET (default: ChangeMe123!)')"
else
    echo "⚠️  .env file not found"
fi

# Step 2: Check if admin exists in database
echo ""
echo "Step 2: Checking if admin user exists in database..."
mysql -u root -p${DB_PASSWORD:-''} crm_system <<EOF 2>/dev/null | grep -v "Using a password" || echo "Please enter MySQL password when prompted"
SELECT email, first_name, last_name, status FROM users WHERE email LIKE '%admin%' OR email = 'admin@crm.local';
EOF

# Step 3: Test login endpoint
echo ""
echo "Step 3: Testing login endpoint..."
ADMIN_EMAIL=$(grep '^DEFAULT_ADMIN_EMAIL=' .env 2>/dev/null | cut -d'=' -f2 || echo 'admin@crm.local')
ADMIN_PASSWORD=$(grep '^DEFAULT_ADMIN_PASSWORD=' .env 2>/dev/null | cut -d'=' -f2 || echo 'ChangeMe123!')

echo "Attempting login with:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "Response:"
echo "$RESPONSE" | head -10

# Step 4: Check backend logs
echo ""
echo "Step 4: Checking backend logs for login attempts..."
pm2 logs amast-crm-backend --lines 20 --nostream | grep -i "login\|auth\|admin" | tail -10 || echo "No relevant logs found"

echo ""
echo "=========================================="
echo "Default Admin Credentials:"
echo "=========================================="
echo "Email: admin@crm.local (or your DEFAULT_ADMIN_EMAIL)"
echo "Password: ChangeMe123! (or your DEFAULT_ADMIN_PASSWORD)"
echo ""
echo "If login fails, check:"
echo "1. Backend logs: pm2 logs amast-crm-backend"
echo "2. Database: Verify admin user exists"
echo "3. Password: Make sure it matches .env file"
echo ""

