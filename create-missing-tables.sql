-- ============================================
-- Create Missing Tables and Columns
-- Run this on your server to create all missing tables
-- ============================================

USE crm_system;

-- ============================================
-- 1. Create company_profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS company_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'User who owns this profile',
  company_url VARCHAR(500) NOT NULL COMMENT 'Company website URL',
  company_name VARCHAR(255) DEFAULT NULL COMMENT 'Company name',
  description TEXT DEFAULT NULL COMMENT 'Company description',
  products_services TEXT DEFAULT NULL COMMENT 'Products and services offered',
  industry VARCHAR(100) DEFAULT NULL COMMENT 'Industry type',
  target_market VARCHAR(255) DEFAULT NULL COMMENT 'Target market',
  company_size VARCHAR(50) DEFAULT NULL COMMENT 'Company size',
  metadata JSON DEFAULT NULL COMMENT 'Additional metadata (JSON)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_user_id (user_id),
  INDEX idx_company_url (company_url),
  INDEX idx_company_name (company_name),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Company profiles for lead generation';

-- ============================================
-- 2. Add email template columns to contacts
-- ============================================
-- Check if columns exist before adding
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME = 'email_template'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN email_template TEXT DEFAULT NULL COMMENT ''Generated email template for this contact''',
  'SELECT ''Column email_template already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME = 'email_subject'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN email_subject VARCHAR(255) DEFAULT NULL COMMENT ''Generated email subject for this contact''',
  'SELECT ''Column email_subject already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME = 'email_generated_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN email_generated_at TIMESTAMP NULL DEFAULT NULL COMMENT ''Timestamp when email was generated''',
  'SELECT ''Column email_generated_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Create email_campaigns table
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contact_id INT NOT NULL COMMENT 'Contact this email is for',
  account_id INT DEFAULT NULL COMMENT 'Account this email is for',
  email_subject VARCHAR(255) NOT NULL COMMENT 'Email subject line',
  email_template TEXT NOT NULL COMMENT 'Email body/template',
  status ENUM('DRAFT', 'PENDING', 'SENT', 'OPENED', 'REPLIED', 'BOUNCED') DEFAULT 'PENDING' COMMENT 'Email status',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM' COMMENT 'Email priority',
  sent_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When email was sent',
  sent_by INT DEFAULT NULL COMMENT 'User who sent the email',
  opened_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When email was opened (if tracked)',
  replied_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When email was replied to (if tracked)',
  communication_started BOOLEAN DEFAULT FALSE COMMENT 'Has communication started with client',
  scheduled_send_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Scheduled send date/time',
  notes TEXT DEFAULT NULL COMMENT 'Additional notes',
  owner_id INT NOT NULL COMMENT 'Owner of this email campaign',
  created_by INT NOT NULL COMMENT 'User who created this campaign',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this campaign',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_contact_id (contact_id),
  INDEX idx_account_id (account_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_sent_at (sent_at),
  INDEX idx_sent_by (sent_by),
  INDEX idx_communication_started (communication_started),
  INDEX idx_owner_id (owner_id),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Email campaigns and tracking';

-- ============================================
-- 4. Create gmail_label_sync_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS gmail_label_sync_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'User who owns this label sync setting',
  label_id VARCHAR(255) NOT NULL COMMENT 'Gmail label ID',
  label_name VARCHAR(255) NOT NULL COMMENT 'Human-readable label name',
  label_type VARCHAR(50) DEFAULT 'user' COMMENT 'Type: user or system (INBOX, SENT, etc.)',
  is_syncing BOOLEAN DEFAULT FALSE COMMENT 'Whether user selected this label to sync',
  last_synced_at TIMESTAMP NULL COMMENT 'Last time emails from this label were synced',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_label (user_id, label_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_syncing (is_syncing),
  INDEX idx_label_id (label_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Gmail label sync settings per user';

-- ============================================
-- 5. Create emails table
-- ============================================
CREATE TABLE IF NOT EXISTS emails (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gmail_message_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Gmail message ID - unique identifier',
  thread_id VARCHAR(255) NOT NULL COMMENT 'Gmail thread ID for grouping conversations',
  subject VARCHAR(500) NULL COMMENT 'Email subject',
  from_email VARCHAR(255) NOT NULL COMMENT 'Sender email address',
  from_name VARCHAR(255) NULL COMMENT 'Sender display name',
  to_email JSON NULL COMMENT 'Array of recipient email addresses',
  cc_email JSON NULL COMMENT 'Array of CC email addresses',
  bcc_email JSON NULL COMMENT 'Array of BCC email addresses',
  body_text TEXT NULL COMMENT 'Plain text email body',
  body_html LONGTEXT NULL COMMENT 'HTML email body',
  received_at TIMESTAMP NULL COMMENT 'When email was received',
  sent_at TIMESTAMP NULL COMMENT 'When email was sent',
  is_read BOOLEAN DEFAULT FALSE COMMENT 'Read status',
  is_starred BOOLEAN DEFAULT FALSE COMMENT 'Starred status',
  label_ids JSON NULL COMMENT 'Array of Gmail label IDs',
  attachment_count INT DEFAULT 0 COMMENT 'Number of attachments',
  contact_id INT NULL COMMENT 'Linked contact (if matched)',
  account_id INT NULL COMMENT 'Linked account (if matched)',
  user_id INT NOT NULL COMMENT 'User who owns this email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_gmail_message_id (gmail_message_id),
  INDEX idx_thread_id (thread_id),
  INDEX idx_from_email (from_email),
  INDEX idx_contact_id (contact_id),
  INDEX idx_account_id (account_id),
  INDEX idx_user_id (user_id),
  INDEX idx_received_at (received_at),
  INDEX idx_deleted_at (deleted_at),
  FULLTEXT INDEX idx_fulltext_search (subject, body_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Synced emails from Gmail';

-- ============================================
-- 6. Create email_attachments table
-- ============================================
CREATE TABLE IF NOT EXISTS email_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email_id INT NOT NULL COMMENT 'Email this attachment belongs to',
  gmail_attachment_id VARCHAR(255) NOT NULL COMMENT 'Gmail attachment ID',
  filename VARCHAR(500) NOT NULL COMMENT 'Attachment filename',
  mime_type VARCHAR(255) NULL COMMENT 'MIME type of attachment',
  size BIGINT DEFAULT 0 COMMENT 'Size in bytes',
  download_url TEXT NULL COMMENT 'Temporary download URL or stored path',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_email_id (email_id),
  INDEX idx_gmail_attachment_id (gmail_attachment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Email attachments metadata';

-- ============================================
-- 7. Create email_sync_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS email_sync_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'User whose emails were synced',
  label_id VARCHAR(255) NULL COMMENT 'Gmail label ID that was synced',
  sync_type ENUM('manual', 'automatic') DEFAULT 'manual' COMMENT 'Type of sync',
  status ENUM('success', 'failed', 'partial') DEFAULT 'success' COMMENT 'Sync status',
  emails_synced INT DEFAULT 0 COMMENT 'Number of emails synced',
  emails_skipped INT DEFAULT 0 COMMENT 'Number of emails skipped (duplicates)',
  error_message TEXT NULL COMMENT 'Error message if sync failed',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When sync started',
  completed_at TIMESTAMP NULL COMMENT 'When sync completed',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_label_id (label_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs of email sync operations';

-- ============================================
-- 8. Add reminder fields to notes table
-- ============================================
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND COLUMN_NAME = 'reminder_date'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notes ADD COLUMN reminder_date DATETIME NULL DEFAULT NULL COMMENT ''Reminder date and time for this note''',
  'SELECT ''Column reminder_date already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND COLUMN_NAME = 'reminder_status'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notes ADD COLUMN reminder_status ENUM(''PENDING'', ''COMPLETED'', ''CANCELLED'') DEFAULT NULL COMMENT ''Reminder status''',
  'SELECT ''Column reminder_status already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND COLUMN_NAME = 'reminder_completed_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notes ADD COLUMN reminder_completed_at TIMESTAMP NULL DEFAULT NULL COMMENT ''When the reminder was marked as completed''',
  'SELECT ''Column reminder_completed_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for reminder fields if they don't exist
SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND INDEX_NAME = 'idx_reminder_date'
);

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE notes ADD INDEX idx_reminder_date (reminder_date)',
  'SELECT ''Index idx_reminder_date already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND INDEX_NAME = 'idx_reminder_status'
);

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE notes ADD INDEX idx_reminder_status (reminder_status)',
  'SELECT ''Index idx_reminder_status already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- Success message
-- ============================================
SELECT 'All missing tables and columns have been created successfully!' AS message;

