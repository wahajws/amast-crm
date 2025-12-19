/**
 * Email Configuration
 * Configure SMTP settings for sending emails
 */

module.exports = {
  // SMTP Configuration
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  },
  
  // Email Settings
  from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@crm.local',
  fromName: process.env.EMAIL_FROM_NAME || 'CRM System',
  
  // Frontend URL (for email links)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Email Templates
  templates: {
    passwordReset: 'password-reset',
    welcome: 'welcome',
    accountApproved: 'account-approved',
    accountRejected: 'account-rejected'
  }
};







