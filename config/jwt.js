module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Increased from 1h to 24h for better UX
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // Increased from 7d to 30d
  issuer: 'crm-system',
  audience: 'crm-users'
};

