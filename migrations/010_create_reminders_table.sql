-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT 'Reminder title',
  description TEXT DEFAULT NULL COMMENT 'Reminder description',
  contact_id INT DEFAULT NULL COMMENT 'Linked contact (if reminder for contact)',
  account_id INT DEFAULT NULL COMMENT 'Linked account (if reminder for account)',
  due_date DATETIME NOT NULL COMMENT 'Due date and time',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  status ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  completed_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Completion timestamp',
  created_by INT NOT NULL COMMENT 'User who created this reminder',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this reminder',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_contact_id (contact_id),
  INDEX idx_account_id (account_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  -- Ensure reminder is tagged to either contact or account (but not both)
  CONSTRAINT chk_reminder_target CHECK (
    (contact_id IS NOT NULL AND account_id IS NULL) OR
    (contact_id IS NULL AND account_id IS NOT NULL)
  ),
  
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM Reminders table (tagged to contacts or accounts)';







