# .env File Values Guide

## Quick Reference for All .env Values

### Database Values (Lines 8-13)

```env
DB_HOST=localhost          # Usually "localhost" - your MySQL server location
DB_USER=root              # Your MySQL username (usually "root")
DB_PASSWORD=              # Your MySQL password (set during MySQL installation)
DB_NAME=crm_system        # Database name (create it first: CREATE DATABASE crm_system;)
DB_PORT=3306              # MySQL port (default is 3306)
DB_CONNECTION_LIMIT=10    # Number of concurrent connections (10 is fine)
```

**How to find MySQL credentials:**
- If you installed MySQL yourself: You set the password during installation
- If using XAMPP: Usually no password (leave empty) or password is "root"
- If using WAMP: Usually no password (leave empty)
- If using MySQL Workbench: Check your connection settings
- If you forgot: You may need to reset MySQL password

**To check MySQL connection:**
```bash
mysql -u root -p
# Enter your password when prompted
```

### Gmail OAuth Values (Lines 14-16)

```env
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

**How to get these:**
1. Go to: https://console.cloud.google.com/
2. Create a project (or select existing)
3. Enable "Gmail API"
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth client ID"
6. Configure OAuth consent screen (first time)
7. Create OAuth client ID (Web application)
8. Add redirect URI: `http://localhost:3000/api/auth/gmail/callback`
9. Copy Client ID and Client Secret

**See detailed guide:** `GMAIL_OAUTH_SETUP.md`

**Note:** For Phase 1, Gmail OAuth is optional. You can leave these as placeholders if you're not implementing Gmail login yet.

### JWT Secret (Line 19)

```env
JWT_SECRET=your-secret-key-change-this-in-production-min-32-characters
```

**How to generate:**
- Use any random string generator
- Must be at least 32 characters long
- Example generators:
  - Online: https://randomkeygen.com/
  - Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - PowerShell: Generate random string

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Default Admin (Lines 22-25)

```env
DEFAULT_ADMIN_EMAIL=admin@crm.local
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
DEFAULT_ADMIN_FIRST_NAME=Admin
DEFAULT_ADMIN_LAST_NAME=User
```

**These are your choice:**
- Set any email you want for the default admin
- Set any password (make it strong!)
- Set any first/last name

**Important:** Change the password after first login!

### Session Secret (Line 28)

```env
SESSION_SECRET=your-session-secret
```

**How to generate:**
- Same as JWT_SECRET
- Can be any random string
- Example: `session-secret-12345-random-string`

## Minimum Required Values to Start

To just get the server running, you need at minimum:

```env
# Database (REQUIRED)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_system
DB_PORT=3306

# JWT (REQUIRED - generate a random 32+ character string)
JWT_SECRET=your-random-32-character-secret-key-here

# CORS (REQUIRED for frontend)
CORS_ORIGIN=http://localhost:3001
```

**Gmail OAuth can be added later** - it's not required for Phase 1 basic functionality.

## Quick Setup Checklist

- [ ] MySQL is installed and running
- [ ] Database `crm_system` is created
- [ ] MySQL username and password are known
- [ ] JWT_SECRET is generated (32+ characters)
- [ ] .env file is created with values
- [ ] Server can connect to database

## Testing Your Values

After setting up `.env`, test the connection:

```bash
npm run dev
```

If you see:
- ✅ "Database connected successfully" - Database values are correct!
- ❌ "Database connection error" - Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

## Common Issues

### "Access denied for user 'root'@'localhost'"
- Wrong password in DB_PASSWORD
- User doesn't exist
- Solution: Check MySQL credentials

### "Unknown database 'crm_system'"
- Database doesn't exist
- Solution: Run `CREATE DATABASE crm_system;` in MySQL

### "JWT_SECRET is too short"
- JWT_SECRET must be 32+ characters
- Solution: Generate a longer secret

### "Port 3000 already in use"
- Another application is using port 3000
- Solution: Change PORT in .env or kill the process







