-- Add email template and subject columns to contacts table
ALTER TABLE contacts 
ADD COLUMN email_template TEXT DEFAULT NULL COMMENT 'Generated email template for this contact',
ADD COLUMN email_subject VARCHAR(255) DEFAULT NULL COMMENT 'Generated email subject for this contact',
ADD COLUMN email_generated_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp when email was generated';

