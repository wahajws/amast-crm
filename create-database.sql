-- Create database for AMAST CRM
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create database user (optional - uncomment and update password)
-- CREATE USER IF NOT EXISTS 'crm_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Use the database
USE crm_system;

-- Show tables (will be empty until migrations run)
SHOW TABLES;

