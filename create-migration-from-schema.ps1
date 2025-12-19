# PowerShell script to create migration script from exported schema
# Run: .\create-migration-from-schema.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Create Migration Script from Schema" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$SCHEMA_FILE = "database_schema.txt"
$OUTPUT_FILE = "migrations/999_create_all_missing_tables.sql"

if (-not (Test-Path $SCHEMA_FILE)) {
    Write-Host "✗ Schema file not found: $SCHEMA_FILE" -ForegroundColor Red
    Write-Host "  Please run export-schema.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading schema from: $SCHEMA_FILE" -ForegroundColor Yellow
Write-Host "Creating migration: $OUTPUT_FILE" -ForegroundColor Yellow
Write-Host ""

# Read schema file
$schemaContent = Get-Content $SCHEMA_FILE -Raw

# Extract CREATE TABLE statements
$createTablePattern = '(?s)CREATE TABLE.*?ENGINE=InnoDB.*?;'
$matches = [regex]::Matches($schemaContent, $createTablePattern)

if ($matches.Count -eq 0) {
    Write-Host "✗ No CREATE TABLE statements found in schema file" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($matches.Count) tables" -ForegroundColor Green
Write-Host ""

# Create migration file content
$migrationContent = @"
-- ============================================
-- Create All Missing Tables
-- Generated from localhost schema export
-- Run this on server to create all missing tables
-- ============================================

USE crm_system;

"@

foreach ($match in $matches) {
    $tableSQL = $match.Value
    
    # Extract table name
    if ($tableSQL -match "CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?") {
        $tableName = $matches[1]
        Write-Host "  - $tableName" -ForegroundColor Cyan
        
        # Add IF NOT EXISTS if not present
        if ($tableSQL -notmatch "IF NOT EXISTS") {
            $tableSQL = $tableSQL -replace "CREATE TABLE", "CREATE TABLE IF NOT EXISTS"
        }
        
        $migrationContent += "`n-- Table: $tableName`n"
        $migrationContent += $tableSQL
        $migrationContent += "`n`n"
    }
}

# Add ALTER TABLE statements for columns that might be missing
$migrationContent += @"

-- ============================================
-- Add missing columns to existing tables
-- ============================================

-- Add email template columns to contacts (if missing)
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME = 'email_template'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN email_template TEXT DEFAULT NULL COMMENT ''Generated email template for this contact''',
  'SELECT ''Column email_template already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME = 'email_subject'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN email_subject VARCHAR(255) DEFAULT NULL COMMENT ''Generated email subject for this contact''',
  'SELECT ''Column email_subject already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME = 'email_generated_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN email_generated_at TIMESTAMP NULL DEFAULT NULL COMMENT ''Timestamp when email was generated''',
  'SELECT ''Column email_generated_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add reminder fields to notes (if missing)
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND COLUMN_NAME = 'reminder_date'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notes ADD COLUMN reminder_date DATETIME NULL DEFAULT NULL COMMENT ''Reminder date and time for this note''',
  'SELECT ''Column reminder_date already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND COLUMN_NAME = 'reminder_status'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notes ADD COLUMN reminder_status ENUM(''PENDING'', ''COMPLETED'', ''CANCELLED'') DEFAULT NULL COMMENT ''Reminder status''',
  'SELECT ''Column reminder_status already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'notes' 
  AND COLUMN_NAME = 'reminder_completed_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notes ADD COLUMN reminder_completed_at TIMESTAMP NULL DEFAULT NULL COMMENT ''When the reminder was marked as completed''',
  'SELECT ''Column reminder_completed_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- Success message
-- ============================================
SELECT 'All missing tables and columns have been created successfully!' AS message;

"@

# Ensure migrations directory exists
$migrationsDir = "migrations"
if (-not (Test-Path $migrationsDir)) {
    New-Item -ItemType Directory -Path $migrationsDir | Out-Null
}

# Write migration file
$migrationContent | Out-File -FilePath $OUTPUT_FILE -Encoding utf8

Write-Host ""
Write-Host "✓ Migration script created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "File: $OUTPUT_FILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "To apply on server:" -ForegroundColor Yellow
Write-Host "  mysql -u root -p crm_system < $OUTPUT_FILE" -ForegroundColor White

