# PowerShell script to export database on Windows
# Run: .\export-database.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Export Database from Localhost" -ForegroundColor Cyan
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

$OUTPUT_FILE = Read-Host "Enter output filename [crm_system_backup.sql]"
if ([string]::IsNullOrWhiteSpace($OUTPUT_FILE)) {
    $OUTPUT_FILE = "crm_system_backup.sql"
}

Write-Host ""
Write-Host "Exporting database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Output file: $OUTPUT_FILE" -ForegroundColor Yellow
Write-Host ""

# Check if mysqldump is available
$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
    Write-Host "✗ mysqldump not found. Please install MySQL client tools." -ForegroundColor Red
    Write-Host "  Or use MySQL Workbench: Server → Data Export" -ForegroundColor Yellow
    exit 1
}

# Export database
$env:MYSQL_PWD = $DB_PASSWORD_PLAIN
& mysqldump -u $DB_USER `
    --single-transaction `
    --routines `
    --triggers `
    --events `
    --add-drop-database `
    --databases $DB_NAME | Out-File -FilePath $OUTPUT_FILE -Encoding utf8

$env:MYSQL_PWD = $null

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $OUTPUT_FILE).Length / 1MB
    Write-Host "✓ Database exported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "File: $OUTPUT_FILE" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To transfer to server, use:" -ForegroundColor Yellow
    Write-Host "  scp -i Public-Environment.ppk $OUTPUT_FILE root@47.250.126.192:/opt/amast-crm/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use WinSCP (GUI tool for Windows)" -ForegroundColor Yellow
} else {
    Write-Host "✗ Export failed" -ForegroundColor Red
    exit 1
}

