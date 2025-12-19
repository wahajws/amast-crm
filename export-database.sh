#!/bin/bash

echo "=========================================="
echo "Export Database from Localhost"
echo "=========================================="

# Get database credentials
read -p "Enter MySQL username [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL password: " DB_PASSWORD
echo ""

read -p "Enter database name [crm_system]: " DB_NAME
DB_NAME=${DB_NAME:-crm_system}

read -p "Enter output filename [crm_system_backup.sql]: " OUTPUT_FILE
OUTPUT_FILE=${OUTPUT_FILE:-crm_system_backup.sql}

echo ""
echo "Exporting database: $DB_NAME"
echo "Output file: $OUTPUT_FILE"
echo ""

# Export database
export MYSQL_PWD="$DB_PASSWORD"
mysqldump -u "$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases "$DB_NAME" > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Database exported successfully!"
    echo ""
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
    echo ""
    echo "To transfer to server, use:"
    echo "  scp $OUTPUT_FILE root@47.250.126.192:/opt/amast-crm/"
    echo ""
    echo "Or use SCP with PPK key:"
    echo "  scp -i Public-Environment.ppk $OUTPUT_FILE root@47.250.126.192:/opt/amast-crm/"
else
    echo "✗ Export failed"
    exit 1
fi

unset MYSQL_PWD

