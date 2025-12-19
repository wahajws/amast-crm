-- Create email_attachments table
CREATE TABLE IF NOT EXISTS email_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email_id INT NOT NULL COMMENT 'Email this attachment belongs to',
  gmail_attachment_id VARCHAR(255) NOT NULL COMMENT 'Gmail attachment ID',
  filename VARCHAR(500) NOT NULL COMMENT 'Attachment filename',
  mime_type VARCHAR(255) NULL COMMENT 'MIME type of attachment',
  size BIGINT DEFAULT 0 COMMENT 'Size in bytes',
  download_url TEXT NULL COMMENT 'Temporary download URL or stored path',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_email_id (email_id),
  INDEX idx_gmail_attachment_id (gmail_attachment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Email attachments metadata';







