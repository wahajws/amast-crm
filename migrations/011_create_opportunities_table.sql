-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT 'Opportunity name',
  description TEXT DEFAULT NULL COMMENT 'Opportunity description',
  account_id INT DEFAULT NULL COMMENT 'Linked account/company',
  contact_id INT DEFAULT NULL COMMENT 'Primary contact for this opportunity',
  stage ENUM('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST') DEFAULT 'PROSPECTING',
  probability INT DEFAULT 0 COMMENT 'Win probability percentage (0-100)',
  amount DECIMAL(15, 2) DEFAULT NULL COMMENT 'Opportunity value/amount',
  expected_close_date DATE DEFAULT NULL COMMENT 'Expected close date',
  actual_close_date DATE DEFAULT NULL COMMENT 'Actual close date',
  owner_id INT DEFAULT NULL COMMENT 'Assigned user/owner',
  status ENUM('ACTIVE', 'WON', 'LOST', 'CANCELLED') DEFAULT 'ACTIVE',
  created_by INT DEFAULT NULL COMMENT 'User who created this record',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_name (name),
  INDEX idx_account_id (account_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_stage (stage),
  INDEX idx_status (status),
  INDEX idx_owner_id (owner_id),
  INDEX idx_expected_close_date (expected_close_date),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM Opportunities table';







