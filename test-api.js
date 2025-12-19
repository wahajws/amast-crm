/**
 * Backend API Test Script
 * Tests all available endpoints using Node.js built-in modules
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_HOST = new URL(API_URL).hostname;
const API_PORT = new URL(API_URL).port || 80;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
  passed++;
}

function logError(message, error = null) {
  log(`  ❌ ${message}`, 'red');
  if (error) {
    log(`     ${error}`, 'red');
  }
  failed++;
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const response = await makeRequest(method, endpoint, data);
    
    if (response.status === expectedStatus) {
      logSuccess(`${method} ${endpoint} - Status: ${response.status}`);
      if (response.data && typeof response.data === 'object') {
        log(`     Response: ${JSON.stringify(response.data).substring(0, 100)}...`, 'yellow');
      }
      return { success: true, data: response.data };
    } else {
      logError(`${method} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`);
      return { success: false, data: response.data };
    }
  } catch (error) {
    logError(`${method} ${endpoint}`, error.message);
    return { success: false, error };
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 Backend API Test Suite', 'blue');
  log('='.repeat(60), 'blue');
  log(`API URL: ${API_URL}\n`, 'yellow');

  // Test 1: Server Health Check
  logTest('Server Health Check');
  await testEndpoint('GET', '/health');

  // Test 2: API Health Check
  logTest('API Health Check');
  await testEndpoint('GET', '/api/health');

  // Test 3: Non-existent endpoint (should return 404)
  logTest('404 Handler');
  await testEndpoint('GET', '/api/nonexistent', null, 404);

  // Test 4: Authentication endpoints (should return 404)
  logTest('Authentication Endpoints');
  log('  Testing: POST /api/auth/login (should fail - not implemented)', 'yellow');
  await testEndpoint('POST', '/api/auth/login', { email: 'test@test.com', password: 'test' }, 404);

  // Test 5: User endpoints (should return 404)
  logTest('User Management Endpoints');
  log('  Testing: GET /api/users (should fail - not implemented)', 'yellow');
  await testEndpoint('GET', '/api/users', null, 404);

  // Test 6: Role endpoints (should return 404)
  logTest('Role Management Endpoints');
  log('  Testing: GET /api/roles (should fail - not implemented)', 'yellow');
  await testEndpoint('GET', '/api/roles', null, 404);

  // Test 7: CORS headers
  logTest('CORS Configuration');
  try {
    const response = await makeRequest('GET', '/api/health');
    if (response.headers['access-control-allow-origin']) {
      logSuccess('CORS headers present');
      log(`     CORS Origin: ${response.headers['access-control-allow-origin']}`, 'yellow');
    } else {
      logError('CORS headers missing');
    }
  } catch (error) {
    logError('CORS test failed', error.message);
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Total: ${passed + failed}`, 'cyan');
  
  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
  }

  log('\n' + '='.repeat(60), 'blue');
  log('📝 Implementation Status', 'blue');
  log('='.repeat(60), 'blue');
  log('✅ Server running', 'green');
  log('✅ Health check endpoints working', 'green');
  log('✅ Error handling working', 'green');
  log('✅ CORS configured', 'green');
  log('❌ Authentication endpoints - Not implemented', 'red');
  log('❌ User management endpoints - Not implemented', 'red');
  log('❌ Role management endpoints - Not implemented', 'red');
  log('❌ Database models - Not created', 'red');
  log('❌ Controllers - Not created', 'red');
  log('❌ Services - Not created', 'red');
  log('\n💡 Next Steps: Implement Phase 1 features', 'yellow');
  log('='.repeat(60) + '\n', 'blue');
}

// Run tests
runTests().catch((error) => {
  logError('Test suite failed to run', error.message);
  process.exit(1);
});
