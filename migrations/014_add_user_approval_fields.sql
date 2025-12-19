-- Add user approval and registration fields
-- This migration is handled by runMigrationsSafe.js which checks for existing columns
-- If running manually, you may need to skip columns that already exist

-- Add registration_token
ALTER TABLE users 
ADD COLUMN registration_token VARCHAR(255) NULL DEFAULT NULL COMMENT 'Token for email verification';

-- Add registration_token_expires_at
ALTER TABLE users 
ADD COLUMN registration_token_expires_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Registration token expiration';

-- Add email_verified_at
ALTER TABLE users 
ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Email verification timestamp';

-- Add approved_at
ALTER TABLE users 
ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Admin approval timestamp';

-- Add approved_by
ALTER TABLE users 
ADD COLUMN approved_by INT NULL DEFAULT NULL COMMENT 'Admin who approved the user';

-- Add failed_login_attempts
ALTER TABLE users 
ADD COLUMN failed_login_attempts INT DEFAULT 0 COMMENT 'Number of failed login attempts';

-- Add locked_until
ALTER TABLE users 
ADD COLUMN locked_until TIMESTAMP NULL DEFAULT NULL COMMENT 'Account lock expiration time';

-- Add must_change_password
ALTER TABLE users 
ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE COMMENT 'Force password change on next login';

-- Add indexes
ALTER TABLE users ADD INDEX idx_registration_token (registration_token);
ALTER TABLE users ADD INDEX idx_email_verified_at (email_verified_at);
ALTER TABLE users ADD INDEX idx_approved_at (approved_at);
ALTER TABLE users ADD INDEX idx_locked_until (locked_until);

-- Add foreign key for approved_by
ALTER TABLE users 
ADD CONSTRAINT fk_users_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
