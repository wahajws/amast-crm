#!/bin/bash

echo "=========================================="
echo "Import Database to Server"
echo "=========================================="

cd /opt/amast-crm/amast-crm || exit 1

# Get backup file
read -p "Enter backup SQL file path [/opt/amast-crm/crm_system_backup.sql]: " BACKUP_FILE
BACKUP_FILE=${BACKUP_FILE:-/opt/amast-crm/crm_system_backup.sql}

if [ ! -f "$BACKUP_FILE" ]; then
    echo "✗ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "Backup file: $BACKUP_FILE"
echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Get MySQL password
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

# Confirm
echo ""
read -p "⚠️  This will OVERWRITE the existing database. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Create database if it doesn't exist
echo ""
echo "Step 1: Creating database if needed..."
export MYSQL_PWD="$MYSQL_PASSWORD"
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

if [ $? -ne 0 ]; then
    echo "✗ Failed to create database"
    exit 1
fi
echo "✓ Database ready"

# Import database
echo ""
echo "Step 2: Importing database..."
echo "This may take a few minutes..."
mysql -u root crm_system < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Database imported successfully!"
    echo ""
    echo "Step 3: Verifying import..."
    USER_COUNT=$(mysql -u root crm_system -sN -e "SELECT COUNT(*) FROM users;" 2>/dev/null)
    ROLE_COUNT=$(mysql -u root crm_system -sN -e "SELECT COUNT(*) FROM roles;" 2>/dev/null)
    echo "  Users: $USER_COUNT"
    echo "  Roles: $ROLE_COUNT"
    echo ""
    echo "✓ Import complete!"
    echo ""
    echo "You may need to restart the backend:"
    echo "  pm2 restart amast-crm-backend"
else
    echo "✗ Import failed"
    exit 1
fi

unset MYSQL_PWD

