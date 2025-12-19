-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT 'Proposal title',
  description TEXT DEFAULT NULL COMMENT 'Proposal description',
  opportunity_id INT DEFAULT NULL COMMENT 'Linked opportunity',
  account_id INT DEFAULT NULL COMMENT 'Linked account/company',
  contact_id INT DEFAULT NULL COMMENT 'Primary contact for this proposal',
  proposal_number VARCHAR(100) DEFAULT NULL COMMENT 'Proposal number/reference',
  amount DECIMAL(15, 2) DEFAULT NULL COMMENT 'Proposal amount/value',
  currency VARCHAR(10) DEFAULT 'USD' COMMENT 'Currency code',
  valid_until DATE DEFAULT NULL COMMENT 'Proposal validity date',
  status ENUM('DRAFT', 'SENT', 'REVIEWED', 'APPROVED', 'REJECTED', 'ACCEPTED') DEFAULT 'DRAFT',
  owner_id INT DEFAULT NULL COMMENT 'Assigned user/owner',
  created_by INT DEFAULT NULL COMMENT 'User who created this record',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_title (title),
  INDEX idx_opportunity_id (opportunity_id),
  INDEX idx_account_id (account_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_status (status),
  INDEX idx_proposal_number (proposal_number),
  INDEX idx_owner_id (owner_id),
  INDEX idx_valid_until (valid_until),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM Proposals table';







