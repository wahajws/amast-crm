# Backend Quick Start Guide

## Prerequisites

1. **Node.js** installed (v14 or higher)
2. **MySQL** installed and running
3. **Database** `crm_system` created

## Step-by-Step Setup

### 1. Install Dependencies

Open terminal in the project root directory (`C:\Users\wahaj\Desktop\CRM`) and run:

```bash
npm install
```

This installs all required packages from `package.json`.

### 2. Create MySQL Database

Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# Windows PowerShell
copy .env.example .env

# Or manually create .env file
```

Edit `.env` file with your settings:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (UPDATE THESE!)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_system
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# JWT (Generate a strong secret - at least 32 characters)
JWT_SECRET=your-very-long-and-secure-secret-key-minimum-32-characters-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Gmail OAuth (Optional for now - can be added later)
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

# CORS (For frontend)
CORS_ORIGIN=http://localhost:3001
```

**Important:** Update at minimum:
- `DB_PASSWORD` - Your MySQL password
- `JWT_SECRET` - A strong random string (32+ characters)
- `CORS_ORIGIN` - Should match your frontend URL (http://localhost:3001)

### 4. Run Database Migrations

**Note:** Database migrations haven't been created yet. Once they're available, you'll run them to create tables.

For now, the server will start but won't have database tables yet.

### 5. Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 6. Verify Server is Running

You should see output like:
```
Server running on port 3000 in development mode
Database connected successfully
```

**Test the server:**
- Open browser: http://localhost:3000/health
- Should return: `{"status":"OK","timestamp":"...","environment":"development"}`

**Test API:**
- Open browser: http://localhost:3000/api/health
- Should return: `{"success":true,"message":"API is healthy",...}`

## Troubleshooting

### Error: "Cannot find module"
**Solution:** Run `npm install` again

### Error: "Database connection error"
**Solutions:**
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database `crm_system` exists
- Check MySQL port (default: 3306)

### Error: "Port 3000 already in use"
**Solutions:**
- Change `PORT` in `.env` file
- Or kill the process using port 3000:
  ```bash
  # Windows PowerShell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### Error: "JWT_SECRET is too short"
**Solution:** Make sure `JWT_SECRET` in `.env` is at least 32 characters

## Next Steps

Once backend is running:
1. Database migrations need to be created (for Phase 1 implementation)
2. Models, Repositories, Services, Controllers need to be implemented
3. Then you can test the full API

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (auto-reload on file changes)
npm run dev

# Start production server
npm start

# Check Node.js version
node --version

# Check npm version
npm --version
```

## Server Endpoints (Once Implemented)

- `GET /health` - Health check
- `GET /api/health` - API health check
- `POST /api/auth/login` - User login
- `GET /api/auth/gmail` - Gmail OAuth
- `GET /api/users` - List users
- `POST /api/users` - Create user
- And more...

## Notes

- Server runs on `http://localhost:3000` by default
- Logs are saved in `logs/` directory
- Environment variables are loaded from `.env` file
- Never commit `.env` file to version control







