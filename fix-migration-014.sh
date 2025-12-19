#!/bin/bash

echo "=========================================="
echo "Fix Migration 014 - User Approval Fields"
echo "=========================================="
echo ""

cd /opt/amast-crm/amast-crm || exit 1

echo "Step 1: Adding missing columns (if any)..."
node utils/fix-missing-columns.js

echo ""
echo "Step 2: Running migrations..."
npm run migrate

echo ""
echo "✓ Done! You can now test login:"
echo "  curl -X POST http://localhost:3001/api/auth/login \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"email\":\"admin@crm.local\",\"password\":\"ChangeMe123!\"}'"

