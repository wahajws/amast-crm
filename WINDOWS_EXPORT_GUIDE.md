# Database Export Guide for Windows

## Method 1: Using PowerShell Script

```powershell
# Navigate to project directory
cd C:\Users\wahaj\Desktop\CRM

# Run the PowerShell script
.\export-database.ps1
```

## Method 2: Using MySQL Command Line (PowerShell)

```powershell
# Set password as environment variable (more secure)
$env:MYSQL_PWD = "your_mysql_password"

# Export database
mysqldump -u root --databases crm_system > crm_system_backup.sql

# Clear password
$env:MYSQL_PWD = $null
```

Or with password prompt:
```powershell
mysqldump -u root -p --databases crm_system > crm_system_backup.sql
```

## Method 3: Using MySQL Workbench (GUI - Easiest)

1. **Open MySQL Workbench**
2. **Connect to your local MySQL server**
3. **Go to:** Server → Data Export
4. **Select:** `crm_system` database
5. **Choose:** "Export to Self-Contained File"
6. **File path:** Choose location (e.g., `C:\Users\wahaj\Desktop\CRM\crm_system_backup.sql`)
7. **Click:** "Start Export"

## Transfer to Server

### Option 1: Using SCP (if you have Git Bash or WSL)

```bash
# In Git Bash or WSL
scp -i Public-Environment.ppk crm_system_backup.sql root@47.250.126.192:/opt/amast-crm/
```

### Option 2: Using WinSCP (Recommended for Windows)

1. **Download WinSCP:** https://winscp.net/
2. **Install and open WinSCP**
3. **Click "New Session"**
4. **Configure:**
   - File protocol: SFTP
   - Host name: `47.250.126.192`
   - Port: 22
   - User name: `root`
   - **Advanced → Authentication → Private key file:** Browse and select `Public-Environment.ppk`
5. **Click "Login"**
6. **Navigate to:** `/opt/amast-crm/`
7. **Drag and drop** `crm_system_backup.sql` from your local machine

### Option 3: Using PowerShell SCP (Windows 10+)

```powershell
# Convert PPK to OpenSSH format first (one-time)
# Download puttygen from PuTTY website
# Or use: ssh-keygen -i -f Public-Environment.ppk > id_rsa

# Then use:
scp -i id_rsa crm_system_backup.sql root@47.250.126.192:/opt/amast-crm/
```

## Import on Server

After transferring the file, SSH into server and import:

```bash
# SSH into server
ssh -i Public-Environment.ppk root@47.250.126.192

# Navigate to project
cd /opt/amast-crm/amast-crm

# Import database
mysql -u root -p crm_system < /opt/amast-crm/crm_system_backup.sql
```

Or use the import script:
```bash
cd /opt/amast-crm/amast-crm
git pull
chmod +x import-database.sh
./import-database.sh
```

## Quick Commands Summary

### Export (PowerShell)
```powershell
mysqldump -u root -p --databases crm_system > crm_system_backup.sql
```

### Transfer (WinSCP or Git Bash)
```bash
scp -i Public-Environment.ppk crm_system_backup.sql root@47.250.126.192:/opt/amast-crm/
```

### Import (Server)
```bash
mysql -u root -p crm_system < /opt/amast-crm/crm_system_backup.sql
```

