-- Create gmail_label_sync_settings table
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







