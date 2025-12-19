-- Seed default roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('SUPER_ADMIN', 'Super Admin', 'Highest level of access with full system control', TRUE),
('ADMIN', 'Admin', 'Full access to CRM features and user management', TRUE),
('MANAGER', 'Manager', 'Can manage team contacts, accounts, and activities', TRUE),
('USER', 'User', 'Standard user with access to own data only', TRUE),
('VIEWER', 'Viewer', 'Read-only access to all data', TRUE)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);







