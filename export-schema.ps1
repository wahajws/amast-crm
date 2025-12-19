# PowerShell script to export database schema from localhost
# Run: .\export-schema.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Export Database Schema from Localhost" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials
$DB_USER = Read-Host "Enter MySQL username [root]"
if ([string]::IsNullOrWhiteSpace($DB_USER)) {
    $DB_USER = "root"
}

$DB_PASSWORD = Read-Host "Enter MySQL password" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
)

$DB_NAME = Read-Host "Enter database name [crm_system]"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) {
    $DB_NAME = "crm_system"
}

$OUTPUT_FILE = "database_schema.txt"

Write-Host ""
Write-Host "Exporting schema for database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Output file: $OUTPUT_FILE" -ForegroundColor Yellow
Write-Host ""

# Check if mysqldump is available
$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
    Write-Host "✗ mysqldump not found. Please install MySQL client tools." -ForegroundColor Red
    exit 1
}

# Export schema only (no data, no drop statements)
$env:MYSQL_PWD = $DB_PASSWORD_PLAIN
& mysqldump -u $DB_USER `
    --no-data `
    --skip-add-drop-table `
    --skip-comments `
    --skip-triggers `
    --skip-routines `
    --skip-events `
    --databases $DB_NAME | Out-File -FilePath $OUTPUT_FILE -Encoding utf8

$env:MYSQL_PWD = $null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema exported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "File: $OUTPUT_FILE" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step: Run create-migration-from-schema.ps1 to generate migration script" -ForegroundColor Yellow
} else {
    Write-Host "✗ Export failed" -ForegroundColor Red
    exit 1
}

