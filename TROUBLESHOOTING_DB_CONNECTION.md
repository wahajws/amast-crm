# Troubleshooting Database Connection Error

## Error: "Access denied for user 'root'@'localhost' (using password: NO)"

This error means your `.env` file is either:
1. **Not being read** by the application
2. **Missing** the `DB_PASSWORD` value
3. **In the wrong location**

## Quick Fix Steps

### Step 1: Check if .env file exists

Run this command in PowerShell (in the CRM directory):

```powershell
Test-Path .env
```

If it returns `False`, the file doesn't exist.

### Step 2: Verify .env file location

The `.env` file **MUST** be in the root directory:
```
C:\Users\wahaj\Desktop\CRM\.env
```

**NOT** in:
- `C:\Users\wahaj\Desktop\CRM\config\.env` ❌
- `C:\Users\wahaj\Desktop\CRM\src\.env` ❌

### Step 3: Check .env file contents

Open `.env` file and verify it has:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=crm_system
DB_PORT=3306
```

**Important:** 
- If your MySQL has **NO password**, set: `DB_PASSWORD=` (empty)
- If your MySQL has a password, set: `DB_PASSWORD=your_actual_password`

### Step 4: Run diagnostic script

I've created a diagnostic script. Run:

```powershell
node check-env.js
```

This will show you:
- If .env file exists
- What values are being read
- What's missing

### Step 5: Common Issues & Solutions

#### Issue 1: .env file not found
**Solution:**
```powershell
# Create .env file
New-Item -Path .env -ItemType File

# Or copy from example (if exists)
Copy-Item .env.example .env
```

#### Issue 2: DB_PASSWORD is empty
**Solution:**
1. Open `.env` file
2. Find the line: `DB_PASSWORD=`
3. Add your MySQL password:
   ```env
   DB_PASSWORD=your_mysql_password
   ```
4. Save the file

#### Issue 3: MySQL has no password
**Solution:**
If MySQL was installed without a password (common with XAMPP/WAMP):
```env
DB_PASSWORD=
```
Leave it empty (but the line must exist).

#### Issue 4: Wrong MySQL password
**Solution:**
1. Test your MySQL password:
   ```powershell
   mysql -u root -p
   ```
2. Enter your password when prompted
3. If it works, use that password in `.env`
4. If it doesn't work, you need to reset MySQL password

#### Issue 5: .env file has spaces or quotes
**Solution:**
Make sure your `.env` file looks like this (NO quotes, NO spaces around =):

```env
# CORRECT ✅
DB_PASSWORD=mypassword123

# WRONG ❌
DB_PASSWORD = mypassword123
DB_PASSWORD="mypassword123"
DB_PASSWORD='mypassword123'
```

### Step 6: Verify MySQL is running

```powershell
# Check if MySQL service is running
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

Or try to connect manually:
```powershell
mysql -u root -p
```

### Step 7: Test connection after fixing

After updating `.env`, restart the server:

```powershell
npm start
```

## Complete .env File Template

Create/update your `.env` file with this template:

```env
# Server
PORT=3000
NODE_ENV=development

# Database - UPDATE THESE!
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=crm_system
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=your-random-32-character-secret-key-minimum-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Gmail OAuth (Optional for now)
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Default Admin
DEFAULT_ADMIN_EMAIL=admin@crm.local
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
DEFAULT_ADMIN_FIRST_NAME=Admin
DEFAULT_ADMIN_LAST_NAME=User

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=your-session-secret

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:3001
```

## Quick Test Commands

### Test 1: Check if .env is being read
```powershell
node check-env.js
```

### Test 2: Test MySQL connection manually
```powershell
mysql -u root -p
# Enter password when prompted
```

### Test 3: Check if database exists
```powershell
mysql -u root -p -e "SHOW DATABASES LIKE 'crm_system';"
```

### Test 4: Create database if missing
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS crm_system;"
```

## Still Not Working?

1. **Check file encoding**: Make sure `.env` is saved as UTF-8 (not UTF-8 BOM)
2. **Restart terminal**: Close and reopen PowerShell after creating .env
3. **Check for hidden characters**: Re-type the DB_PASSWORD line
4. **Verify MySQL is running**: Check Windows Services
5. **Try with full path**: Test if MySQL works with full connection string

## Need More Help?

Run the diagnostic and share the output:
```powershell
node check-env.js
```

This will help identify the exact issue.







