const { google } = require('googleapis');
const gmailConfig = require('../config/gmail');
const { logger } = require('../utils/logger');
const UserRepository = require('../repositories/UserRepository');

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      gmailConfig.clientId,
      gmailConfig.clientSecret,
      gmailConfig.redirectUri
    );
  }

  getAuthUrl() {
    const scopes = gmailConfig.scopes;
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent screen to get refresh token
    });
    return url;
  }

  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error('Error getting Gmail tokens:', error);
      throw new Error('Failed to get Gmail tokens');
    }
  }

  async getUserInfo(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      logger.error('Error getting user info:', error);
      throw new Error('Failed to get user info');
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get authenticated Gmail client for a specific user
   * Automatically refreshes token if expired
   */
  async getAuthenticatedClient(user) {
    // Check if user has Gmail tokens
    if (!user.gmailAccessToken || !user.gmailRefreshToken) {
      throw new Error('User has not connected Gmail account');
    }

    // Check if token is expired (with 5 minute buffer)
    const expiryTime = user.gmailTokenExpiry ? new Date(user.gmailTokenExpiry) : null;
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (expiryTime && (now.getTime() + bufferTime) >= expiryTime.getTime()) {
      // Token expired or about to expire, refresh it
      logger.info(`Refreshing Gmail token for user ${user.id}`);
      const newTokens = await this.refreshAccessToken(user.gmailRefreshToken);
      
      // Update user's tokens in database
      const userRepo = new UserRepository();
      await userRepo.update(user.id, {
        gmail_access_token: newTokens.access_token,
        gmail_token_expiry: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null
      });

      // Use new token
      this.oauth2Client.setCredentials({
        access_token: newTokens.access_token,
        refresh_token: user.gmailRefreshToken
      });
    } else {
      // Use existing token
      this.oauth2Client.setCredentials({
        access_token: user.gmailAccessToken,
        refresh_token: user.gmailRefreshToken
      });
    }

    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Get all labels for a specific user
   */
  async getUserLabels(user) {
    try {
      const gmail = await this.getAuthenticatedClient(user);
      const response = await gmail.users.labels.list({
        userId: 'me'
      });

      return response.data.labels || [];
    } catch (error) {
      logger.error(`Error fetching labels for user ${user.id}:`, error);
      throw new Error('Failed to fetch Gmail labels');
    }
  }

  /**
   * Get emails from a specific label
   */
  async getEmailsFromLabel(user, labelId, maxResults = 50, pageToken = null) {
    try {
      const gmail = await this.getAuthenticatedClient(user);
      const params = {
        userId: 'me',
        labelIds: [labelId],
        maxResults: maxResults
      };
      
      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await gmail.users.messages.list(params);
      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken || null
      };
    } catch (error) {
      logger.error(`Error fetching emails for user ${user.id}, label ${labelId}:`, error);
      throw new Error('Failed to fetch emails');
    }
  }

  /**
   * Get full email message details
   */
  async getEmailMessage(user, messageId) {
    try {
      const gmail = await this.getAuthenticatedClient(user);
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching email message ${messageId} for user ${user.id}:`, error);
      throw new Error('Failed to fetch email message');
    }
  }

  /**
   * Get email attachment
   */
  async getEmailAttachment(user, messageId, attachmentId) {
    try {
      const gmail = await this.getAuthenticatedClient(user);
      const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching attachment ${attachmentId} for message ${messageId}:`, error);
      throw new Error('Failed to fetch email attachment');
    }
  }
}

module.exports = GmailService;

