-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT 'Company/Account name',
  industry VARCHAR(100) DEFAULT NULL COMMENT 'Industry type',
  website VARCHAR(255) DEFAULT NULL COMMENT 'Company website',
  phone VARCHAR(50) DEFAULT NULL COMMENT 'Primary phone number',
  email VARCHAR(255) DEFAULT NULL COMMENT 'Primary email address',
  billing_street VARCHAR(255) DEFAULT NULL COMMENT 'Billing address street',
  billing_city VARCHAR(100) DEFAULT NULL COMMENT 'Billing address city',
  billing_state VARCHAR(100) DEFAULT NULL COMMENT 'Billing address state',
  billing_postal_code VARCHAR(20) DEFAULT NULL COMMENT 'Billing postal code',
  billing_country VARCHAR(100) DEFAULT NULL COMMENT 'Billing country',
  shipping_street VARCHAR(255) DEFAULT NULL COMMENT 'Shipping address street',
  shipping_city VARCHAR(100) DEFAULT NULL COMMENT 'Shipping address city',
  shipping_state VARCHAR(100) DEFAULT NULL COMMENT 'Shipping address state',
  shipping_postal_code VARCHAR(20) DEFAULT NULL COMMENT 'Shipping postal code',
  shipping_country VARCHAR(100) DEFAULT NULL COMMENT 'Shipping country',
  description TEXT DEFAULT NULL COMMENT 'Account description',
  annual_revenue DECIMAL(15, 2) DEFAULT NULL COMMENT 'Annual revenue',
  number_of_employees INT DEFAULT NULL COMMENT 'Number of employees',
  owner_id INT DEFAULT NULL COMMENT 'Assigned user/owner',
  status ENUM('ACTIVE', 'INACTIVE', 'PROSPECT') DEFAULT 'ACTIVE',
  created_by INT DEFAULT NULL COMMENT 'User who created this record',
  updated_by INT DEFAULT NULL COMMENT 'User who last updated this record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  
  INDEX idx_name (name),
  INDEX idx_industry (industry),
  INDEX idx_owner_id (owner_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM Accounts/Companies table';







