-- Create emails table
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







