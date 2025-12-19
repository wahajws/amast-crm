-- Manual SQL to create admin user
-- Run this in MySQL after ensuring roles exist

-- Step 1: Check if roles exist, if not create them
INSERT INTO roles (name, display_name, description, is_system_role, created_at, updated_at)
VALUES 
('SUPER_ADMIN', 'Super Admin', 'Highest level of access with full system control', TRUE, NOW(), NOW()),
('ADMIN', 'Admin', 'Full access to CRM features and user management', TRUE, NOW(), NOW()),
('MANAGER', 'Manager', 'Can manage team contacts, accounts, and activities', TRUE, NOW(), NOW()),
('USER', 'User', 'Standard user with access to own data only', TRUE, NOW(), NOW()),
('VIEWER', 'Viewer', 'Read-only access to all data', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Step 2: Get the SUPER_ADMIN role ID (you'll need this)
SELECT id, name FROM roles WHERE name = 'SUPER_ADMIN';

-- Step 3: Create admin user (replace ROLE_ID with the ID from step 2, and HASHED_PASSWORD with the hash from node command)
-- First, get the hashed password by running this in terminal:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('ChangeMe123!', 10).then(hash => console.log(hash));"

-- Then run:
-- INSERT INTO users (email, password_hash, first_name, last_name, role_id, status, created_at, updated_at)
-- VALUES ('admin@crm.local', 'HASHED_PASSWORD_HERE', 'Admin', 'User', ROLE_ID_HERE, 'ACTIVE', NOW(), NOW())
-- ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = 'ACTIVE', role_id = VALUES(role_id);

