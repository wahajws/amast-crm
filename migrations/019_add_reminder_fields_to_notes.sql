-- Add reminder fields to notes table
ALTER TABLE notes
ADD COLUMN reminder_date DATETIME NULL DEFAULT NULL COMMENT 'Reminder date and time for this note',
ADD COLUMN reminder_status ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT NULL COMMENT 'Reminder status',
ADD COLUMN reminder_completed_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When the reminder was marked as completed',
ADD INDEX idx_reminder_date (reminder_date),
ADD INDEX idx_reminder_status (reminder_status);





