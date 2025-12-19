#!/bin/bash

echo "=========================================="
echo "Testing CORS Configuration"
echo "=========================================="

echo ""
echo "1. Testing OPTIONS preflight request:"
curl -X OPTIONS \
  -H "Origin: http://47.250.126.192" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost:3001/api/auth/login 2>&1 | grep -i "access-control\|HTTP/"

echo ""
echo "2. Testing through Nginx:"
curl -X OPTIONS \
  -H "Origin: http://47.250.126.192" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost/api/auth/login 2>&1 | grep -i "access-control\|HTTP/"

echo ""
echo "3. Testing actual POST request:"
curl -X POST \
  -H "Origin: http://47.250.126.192" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  -v http://localhost:3001/api/auth/login 2>&1 | grep -i "access-control\|HTTP/"

echo ""
echo "=========================================="
echo "Check the output above for CORS headers"
echo "=========================================="

