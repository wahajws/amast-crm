const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const { logger } = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Only create transporter if SMTP is configured
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.warn('Email service not configured properly:', error.message);
          logger.warn('Email sending will be disabled. Set SMTP_USER and SMTP_PASSWORD in .env');
        } else {
          logger.info('Email service ready');
        }
      });
    } else {
      logger.warn('Email service not configured. Set SMTP_USER and SMTP_PASSWORD in .env');
    }
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      logger.warn('Email service not configured. Email not sent to:', to);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = `${emailConfig.frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = this.getPasswordResetTemplate(resetUrl);
    
    return await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail, userName) {
    const subject = 'Welcome to CRM System';
    const html = this.getWelcomeTemplate(userName);
    
    return await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send account approval email
   */
  async sendAccountApprovedEmail(userEmail, userName) {
    const loginUrl = `${emailConfig.frontendUrl}/login`;
    const subject = 'Your Account Has Been Approved';
    const html = this.getAccountApprovedTemplate(userName, loginUrl);
    
    return await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send account rejection email
   */
  async sendAccountRejectedEmail(userEmail, userName, reason = null) {
    const subject = 'Account Registration Status';
    const html = this.getAccountRejectedTemplate(userName, reason);
    
    return await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Email Templates
   */
  getPasswordResetTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to CRM System!</h2>
          <p>Hello ${userName},</p>
          <p>Your account has been created successfully. However, your account is pending admin approval.</p>
          <p>You will receive an email once your account has been approved by an administrator.</p>
          <p>Thank you for joining us!</p>
        </div>
      </body>
      </html>
    `;
  }

  getAccountApprovedTemplate(userName, loginUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Account Approved!</h2>
          <p>Hello ${userName},</p>
          <p>Great news! Your account has been approved by an administrator.</p>
          <p>You can now log in to the CRM system:</p>
          <a href="${loginUrl}" class="button">Login Now</a>
          <p>Thank you for your patience!</p>
        </div>
      </body>
      </html>
    `;
  }

  getAccountRejectedTemplate(userName, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Account Registration Status</h2>
          <p>Hello ${userName},</p>
          <p>We regret to inform you that your account registration has been reviewed and was not approved at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you have any questions, please contact the system administrator.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

module.exports = new EmailService();







