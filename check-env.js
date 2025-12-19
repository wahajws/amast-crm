// Quick script to check if .env file is being loaded
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('\n=== Environment Variables Check ===\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);
console.log(`✓ .env file exists: ${envExists ? 'YES' : 'NO'}`);
if (envExists) {
  console.log(`  Location: ${envPath}\n`);
} else {
  console.log(`  ⚠️  .env file not found at: ${envPath}\n`);
}

// Check database variables
console.log('Database Configuration:');
console.log(`  DB_HOST: ${process.env.DB_HOST || 'NOT SET (default: localhost)'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'NOT SET (default: root)'}`);
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET (empty)'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'NOT SET (default: crm_system)'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || 'NOT SET (default: 3306)'}\n`);

// Check JWT
console.log('JWT Configuration:');
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '***SET***' : 'NOT SET'}\n`);

// Show what password value is (for debugging - remove in production)
if (process.env.DB_PASSWORD) {
  console.log(`  DB_PASSWORD length: ${process.env.DB_PASSWORD.length} characters`);
  console.log(`  DB_PASSWORD value: "${process.env.DB_PASSWORD}"\n`);
} else {
  console.log('  ⚠️  DB_PASSWORD is empty or not set!\n');
}

// Recommendations
console.log('Recommendations:');
if (!envExists) {
  console.log('  1. Create .env file in the root directory');
  console.log('  2. Copy from .env.example if available');
}
if (!process.env.DB_PASSWORD) {
  console.log('  3. Set DB_PASSWORD in .env file');
  console.log('     - If MySQL has no password, set: DB_PASSWORD=');
  console.log('     - If MySQL has password, set: DB_PASSWORD=your_password');
}
if (!process.env.JWT_SECRET) {
  console.log('  4. Set JWT_SECRET in .env file (32+ characters)');
}

console.log('\n=== End of Check ===\n');







