-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT 'Note title',
  content TEXT NOT NULL COMMENT 'Note content',
  contact_id INT DEFAULT NULL COMMENT 'Linked contact (if tagged to contact)',
  account_id INT DEFAULT NULL COMMENT 'Linked account (if tagged to account)',
  created_by INT NOT NULL COMMENT 'User who created this note',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this note',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_contact_id (contact_id),
  INDEX idx_account_id (account_id),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  -- Ensure note is tagged to either contact or account (but not both)
  CONSTRAINT chk_note_target CHECK (
    (contact_id IS NOT NULL AND account_id IS NULL) OR
    (contact_id IS NULL AND account_id IS NOT NULL)
  ),
  
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM Notes table (tagged to contacts or accounts)';







