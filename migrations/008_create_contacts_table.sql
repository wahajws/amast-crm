-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL COMMENT 'First name',
  last_name VARCHAR(100) NOT NULL COMMENT 'Last name',
  email VARCHAR(255) DEFAULT NULL COMMENT 'Email address',
  phone VARCHAR(50) DEFAULT NULL COMMENT 'Phone number',
  mobile VARCHAR(50) DEFAULT NULL COMMENT 'Mobile number',
  title VARCHAR(100) DEFAULT NULL COMMENT 'Job title',
  department VARCHAR(100) DEFAULT NULL COMMENT 'Department',
  account_id INT DEFAULT NULL COMMENT 'Linked account/company',
  mailing_street VARCHAR(255) DEFAULT NULL COMMENT 'Mailing address street',
  mailing_city VARCHAR(100) DEFAULT NULL COMMENT 'Mailing address city',
  mailing_state VARCHAR(100) DEFAULT NULL COMMENT 'Mailing address state',
  mailing_postal_code VARCHAR(20) DEFAULT NULL COMMENT 'Mailing postal code',
  mailing_country VARCHAR(100) DEFAULT NULL COMMENT 'Mailing country',
  description TEXT DEFAULT NULL COMMENT 'Contact description',
  owner_id INT DEFAULT NULL COMMENT 'Assigned user/owner',
  status ENUM('ACTIVE', 'INACTIVE', 'LEAD') DEFAULT 'ACTIVE',
  created_by INT DEFAULT NULL COMMENT 'User who created this record',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_name (first_name, last_name),
  INDEX idx_email (email),
  INDEX idx_account_id (account_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM Contacts table';







