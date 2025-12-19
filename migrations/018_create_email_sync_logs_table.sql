-- Create email_sync_logs table
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







