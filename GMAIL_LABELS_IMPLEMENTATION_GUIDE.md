# Gmail Labels/Folders Reading - Per User Implementation Guide

## Overview

Each user has their own Gmail account (authenticated via OAuth), and their Gmail tokens are stored in the `users` table. We'll use these tokens to fetch each user's labels and allow them to select which ones to sync.

---

## How It Works

### 1. **User Authentication Flow**
```
User logs in with Gmail OAuth
  ↓
Gmail tokens stored in users table:
  - gmail_access_token
  - gmail_refresh_token  
  - gmail_token_expiry
  ↓
Each API request uses the authenticated user's tokens
  ↓
Gmail API calls are made on behalf of that specific user
```

### 2. **Token Management Per User**

When a user makes a request:
1. **Extract user from JWT token** (already done by `authenticate` middleware)
2. **Get user's Gmail tokens** from database
3. **Check if token is expired** → Refresh if needed
4. **Use token to make Gmail API calls** for that specific user

---

## Implementation Steps

### Step 1: Enhance GmailService to Accept User Tokens

The current `GmailService` needs to be enhanced to:
- Accept user-specific tokens
- Handle token refresh automatically
- Make Gmail API calls with user's credentials

### Step 2: Create Database Table for Label Sync Settings

Store which labels each user wants to sync:

```sql
CREATE TABLE gmail_label_sync_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label_id VARCHAR(255) NOT NULL,  -- Gmail's label ID
  label_name VARCHAR(255) NOT NULL, -- Human-readable label name
  label_type VARCHAR(50) DEFAULT 'user', -- 'user' or 'system' (INBOX, SENT, etc.)
  is_syncing BOOLEAN DEFAULT FALSE, -- User selected this label to sync
  last_synced_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_label (user_id, label_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_syncing (is_syncing)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 3: Create Repository for Label Sync Settings

### Step 4: Create Service Methods

### Step 5: Create API Endpoints

### Step 6: Create Frontend UI

---

## Detailed Implementation

### A. Enhanced GmailService

```javascript
// services/GmailService.js - Enhanced version

class GmailService {
  // ... existing methods ...

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
  async getEmailsFromLabel(user, labelId, maxResults = 50) {
    try {
      const gmail = await this.getAuthenticatedClient(user);
      const response = await gmail.users.messages.list({
        userId: 'me',
        labelIds: [labelId],
        maxResults: maxResults
      });

      return response.data.messages || [];
    } catch (error) {
      logger.error(`Error fetching emails for user ${user.id}, label ${labelId}:`, error);
      throw new Error('Failed to fetch emails');
    }
  }
}
```

### B. Label Sync Settings Repository

```javascript
// repositories/GmailLabelSyncRepository.js

const BaseRepository = require('../base/BaseRepository');
const { modelRegistry } = require('../utils/modelRegistry');

class GmailLabelSyncRepository extends BaseRepository {
  constructor() {
    super({ tableName: modelRegistry.getTableName('gmail_label_sync_settings') });
  }

  async findByUserId(userId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY label_name`;
    const results = await this.query(sql, [userId]);
    return results;
  }

  async findByUserIdAndLabelId(userId, labelId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND label_id = ? LIMIT 1`;
    const results = await this.query(sql, [userId, labelId]);
    return results.length > 0 ? results[0] : null;
  }

  async upsertLabelSync(userId, labelData) {
    const { labelId, labelName, labelType, isSyncing } = labelData;
    
    const existing = await this.findByUserIdAndLabelId(userId, labelId);
    
    if (existing) {
      // Update existing
      const sql = `UPDATE ${this.tableName} 
                   SET label_name = ?, label_type = ?, is_syncing = ?, updated_at = NOW()
                   WHERE user_id = ? AND label_id = ?`;
      await this.query(sql, [labelName, labelType, isSyncing, userId, labelId]);
      return existing.id;
    } else {
      // Insert new
      const sql = `INSERT INTO ${this.tableName} 
                   (user_id, label_id, label_name, label_type, is_syncing) 
                   VALUES (?, ?, ?, ?, ?)`;
      const result = await this.query(sql, [userId, labelId, labelName, labelType, isSyncing]);
      return result.insertId;
    }
  }

  async updateSyncStatus(userId, labelIds, isSyncing) {
    const placeholders = labelIds.map(() => '?').join(',');
    const sql = `UPDATE ${this.tableName} 
                 SET is_syncing = ?, updated_at = NOW()
                 WHERE user_id = ? AND label_id IN (${placeholders})`;
    await this.query(sql, [isSyncing, userId, ...labelIds]);
  }

  async getSyncingLabels(userId) {
    const sql = `SELECT * FROM ${this.tableName} 
                 WHERE user_id = ? AND is_syncing = TRUE 
                 ORDER BY label_name`;
    const results = await this.query(sql, [userId]);
    return results;
  }
}

module.exports = GmailLabelSyncRepository;
```

### C. Gmail Service (Business Logic)

```javascript
// services/GmailLabelService.js

const GmailService = require('./GmailService');
const GmailLabelSyncRepository = require('../repositories/GmailLabelSyncRepository');
const { logger } = require('../utils/logger');

class GmailLabelService {
  constructor() {
    this.gmailService = new GmailService();
    this.labelSyncRepo = new GmailLabelSyncRepository();
  }

  /**
   * Fetch and sync user's Gmail labels
   * This will:
   * 1. Get all labels from Gmail API
   * 2. Store them in database (or update if exists)
   * 3. Return labels with sync status
   */
  async syncUserLabels(user) {
    try {
      // Get labels from Gmail API
      const gmailLabels = await this.gmailService.getUserLabels(user);

      // Process each label
      const labels = [];
      for (const gmailLabel of gmailLabels) {
        // Determine label type
        const labelType = this.determineLabelType(gmailLabel.id);

        // Upsert label in database
        await this.labelSyncRepo.upsertLabelSync(user.id, {
          labelId: gmailLabel.id,
          labelName: gmailLabel.name,
          labelType: labelType,
          isSyncing: false // Default to not syncing
        });

        // Get current sync status from database
        const dbLabel = await this.labelSyncRepo.findByUserIdAndLabelId(
          user.id,
          gmailLabel.id
        );

        labels.push({
          id: gmailLabel.id,
          name: gmailLabel.name,
          type: labelType,
          isSyncing: dbLabel ? dbLabel.is_syncing : false,
          messageListVisibility: gmailLabel.messageListVisibility,
          labelListVisibility: gmailLabel.labelListVisibility
        });
      }

      return labels;
    } catch (error) {
      logger.error(`Error syncing labels for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Get user's labels with sync status
   */
  async getUserLabels(user) {
    // First, try to get from database
    const dbLabels = await this.labelSyncRepo.findByUserId(user.id);

    if (dbLabels.length > 0) {
      // Return labels from database
      return dbLabels.map(label => ({
        id: label.label_id,
        name: label.label_name,
        type: label.label_type,
        isSyncing: label.is_syncing,
        lastSyncedAt: label.last_synced_at
      }));
    }

    // If no labels in database, fetch from Gmail and sync
    return await this.syncUserLabels(user);
  }

  /**
   * Update which labels user wants to sync
   */
  async updateSyncSettings(user, labelIds, isSyncing) {
    await this.labelSyncRepo.updateSyncStatus(user.id, labelIds, isSyncing);
    return { success: true };
  }

  /**
   * Get labels that user has selected to sync
   */
  async getSyncingLabels(user) {
    const labels = await this.labelSyncRepo.getSyncingLabels(user.id);
    return labels.map(label => ({
      id: label.label_id,
      name: label.label_name,
      type: label.label_type
    }));
  }

  /**
   * Determine if label is system label or user-created
   */
  determineLabelType(labelId) {
    const systemLabels = [
      'INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'UNREAD', 'STARRED',
      'IMPORTANT', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 
      'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'
    ];

    return systemLabels.includes(labelId) ? 'system' : 'user';
  }
}

module.exports = GmailLabelService;
```

### D. Controller

```javascript
// controllers/GmailController.js

const BaseController = require('../base/BaseController');
const GmailLabelService = require('../services/GmailLabelService');
const { logger } = require('../utils/logger');

class GmailController extends BaseController {
  constructor() {
    super();
    this.gmailLabelService = new GmailLabelService();
  }

  /**
   * GET /api/gmail/labels
   * Get user's Gmail labels with sync status
   */
  getLabels = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);

    // Check if user has Gmail connected
    if (!currentUser.gmailAccessToken) {
      return this.error(res, 'Gmail account not connected. Please connect your Gmail account first.', 400);
    }

    try {
      const labels = await this.gmailLabelService.getUserLabels(currentUser);
      return this.success(res, labels);
    } catch (error) {
      logger.error('Error fetching Gmail labels:', error);
      return this.serverError(res, 'Failed to fetch Gmail labels', error);
    }
  });

  /**
   * POST /api/gmail/labels/sync
   * Sync/refresh user's Gmail labels from Gmail API
   */
  syncLabels = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);

    if (!currentUser.gmailAccessToken) {
      return this.error(res, 'Gmail account not connected', 400);
    }

    try {
      const labels = await this.gmailLabelService.syncUserLabels(currentUser);
      return this.success(res, labels, 'Labels synced successfully');
    } catch (error) {
      logger.error('Error syncing Gmail labels:', error);
      return this.serverError(res, 'Failed to sync Gmail labels', error);
    }
  });

  /**
   * PUT /api/gmail/labels/sync-settings
   * Update which labels user wants to sync
   * Body: { labelIds: ['label1', 'label2'], isSyncing: true }
   */
  updateSyncSettings = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);
    const { labelIds, isSyncing } = req.body;

    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return this.error(res, 'labelIds must be a non-empty array', 400);
    }

    if (typeof isSyncing !== 'boolean') {
      return this.error(res, 'isSyncing must be a boolean', 400);
    }

    try {
      await this.gmailLabelService.updateSyncSettings(currentUser, labelIds, isSyncing);
      return this.success(res, null, 'Sync settings updated successfully');
    } catch (error) {
      logger.error('Error updating sync settings:', error);
      return this.serverError(res, 'Failed to update sync settings', error);
    }
  });

  /**
   * GET /api/gmail/labels/syncing
   * Get labels that user has selected to sync
   */
  getSyncingLabels = this.asyncHandler(async (req, res) => {
    const currentUser = this.getCurrentUser(req);

    try {
      const labels = await this.gmailLabelService.getSyncingLabels(currentUser);
      return this.success(res, labels);
    } catch (error) {
      logger.error('Error fetching syncing labels:', error);
      return this.serverError(res, 'Failed to fetch syncing labels', error);
    }
  });
}

module.exports = GmailController;
```

### E. Routes

```javascript
// routes/gmail.routes.js

const express = require('express');
const router = express.Router();
const GmailController = require('../controllers/GmailController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

const gmailController = new GmailController();

// All routes require authentication
router.use(authenticate);

// Get user's Gmail labels
router.get('/labels', gmailController.getLabels);

// Sync/refresh labels from Gmail
router.post('/labels/sync', gmailController.syncLabels);

// Update sync settings (which labels to sync)
router.put(
  '/labels/sync-settings',
  [
    body('labelIds').isArray().withMessage('labelIds must be an array'),
    body('labelIds.*').isString().withMessage('Each labelId must be a string'),
    body('isSyncing').isBoolean().withMessage('isSyncing must be a boolean')
  ],
  gmailController.updateSyncSettings
);

// Get labels that are currently being synced
router.get('/labels/syncing', gmailController.getSyncingLabels);

module.exports = router;
```

### F. Add Route to Main Router

```javascript
// routes/index.js - Add this line
const gmailRoutes = require('./gmail.routes');
router.use('/gmail', gmailRoutes);
```

---

## Frontend Implementation Example

```javascript
// frontend/src/pages/Settings/GmailIntegration.jsx

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

export default function GmailIntegration() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await api.get('/api/gmail/labels');
      setLabels(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch Gmail labels');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLabels = async () => {
    try {
      await api.post('/api/gmail/labels/sync');
      await fetchLabels(); // Refresh list
      toast.success('Labels synced successfully');
    } catch (error) {
      toast.error('Failed to sync labels');
    }
  };

  const handleToggleSync = async (labelId, currentStatus) => {
    try {
      await api.put('/api/gmail/labels/sync-settings', {
        labelIds: [labelId],
        isSyncing: !currentStatus
      });
      await fetchLabels(); // Refresh list
      toast.success('Sync settings updated');
    } catch (error) {
      toast.error('Failed to update sync settings');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gmail Integration</h2>
      
      <button onClick={handleSyncLabels} className="btn btn-primary mb-4">
        Sync Labels from Gmail
      </button>

      <div className="space-y-2">
        {labels.map(label => (
          <div key={label.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <span className="font-medium">{label.name}</span>
              <span className="text-sm text-gray-500 ml-2">({label.type})</span>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={label.isSyncing}
                onChange={() => handleToggleSync(label.id, label.isSyncing)}
                className="mr-2"
              />
              Sync
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Key Points

1. **Per-User Isolation**: Each API request uses the authenticated user's tokens (from JWT)
2. **Automatic Token Refresh**: Tokens are refreshed automatically if expired
3. **Database Storage**: Label sync preferences stored per user
4. **Gmail API Calls**: Made on behalf of the specific user using their tokens
5. **Security**: Users can only access their own Gmail data (enforced by authentication middleware)

---

## Next Steps

1. Create migration for `gmail_label_sync_settings` table
2. Implement the enhanced GmailService methods
3. Create repository, service, and controller
4. Add routes
5. Create frontend UI
6. Test with multiple users

This ensures each user sees and manages only their own Gmail labels! 🎯







