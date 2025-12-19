# Database Export/Import Guide

## Export Database from Localhost

### Option 1: Using the Script (Recommended)

```bash
# On your local machine
cd C:\Users\wahaj\Desktop\CRM
chmod +x export-database.sh  # If on Linux/Mac
# On Windows, you can use Git Bash or WSL

# Run the export script
./export-database.sh
# or
bash export-database.sh
```

### Option 2: Manual Export

```bash
# On your local machine
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases crm_system > crm_system_backup.sql
```

### Option 3: Using MySQL Workbench

1. Open MySQL Workbench
2. Go to **Server** → **Data Export**
3. Select `crm_system` database
4. Choose **Export to Self-Contained File**
5. Click **Start Export**

## Transfer to Server

### Option 1: Using SCP (with PPK key)

```bash
# On your local machine (Windows PowerShell or Git Bash)
scp -i Public-Environment.ppk crm_system_backup.sql root@47.250.126.192:/opt/amast-crm/
```

### Option 2: Using SCP (with password)

```bash
scp crm_system_backup.sql root@47.250.126.192:/opt/amast-crm/
```

### Option 3: Using WinSCP (Windows GUI)

1. Download WinSCP
2. Connect to server using your PPK key
3. Upload `crm_system_backup.sql` to `/opt/amast-crm/`

## Import Database on Server

### Option 1: Using the Script (Recommended)

```bash
# SSH into server
ssh -i Public-Environment.ppk root@47.250.126.192

# Navigate to project
cd /opt/amast-crm/amast-crm

# Pull latest code
git pull

# Run import script
chmod +x import-database.sh
./import-database.sh
```

### Option 2: Manual Import

```bash
# On server
mysql -u root -p crm_system < /opt/amast-crm/crm_system_backup.sql
```

## Important Notes

### Before Importing

1. **Backup current server database** (if you have important data):
   ```bash
   mysqldump -u root -p crm_system > crm_system_server_backup_$(date +%Y%m%d).sql
   ```

2. **Stop the backend** (optional but recommended):
   ```bash
   pm2 stop amast-crm-backend
   ```

### After Importing

1. **Restart backend**:
   ```bash
   pm2 restart amast-crm-backend
   ```

2. **Verify data**:
   ```bash
   mysql -u root -p crm_system -e "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as roles FROM roles;"
   ```

## Troubleshooting

### Export fails
- Check MySQL credentials
- Ensure mysqldump is installed
- Check database name is correct

### Import fails
- Check file was transferred completely
- Verify MySQL user has permissions
- Check database exists
- Look for foreign key constraint errors

### Missing columns after import
- Run migrations: `npm run migrate`
- Check migration files are up to date

## Quick Commands

```bash
# Export (localhost)
mysqldump -u root -p --databases crm_system > backup.sql

# Transfer
scp -i Public-Environment.ppk backup.sql root@47.250.126.192:/opt/amast-crm/

# Import (server)
mysql -u root -p crm_system < /opt/amast-crm/backup.sql
```

