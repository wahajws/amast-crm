-- Create company_profiles table
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

