# Development Environment Setup Instructions

## Step-by-Step Setup Guide

### 1. Prerequisites Installation

**Install Node.js:**
- Download and install Node.js (v14 or higher) from https://nodejs.org/
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

**Install MySQL:**
- Download and install MySQL (v8.0 or higher) from https://dev.mysql.com/downloads/mysql/
- Or use XAMPP/WAMP which includes MySQL
- Verify installation:
  ```bash
  mysql --version
  ```

### 2. Project Setup

**Navigate to project directory:**
```bash
cd C:\Users\wahaj\Desktop\CRM
```

**Install dependencies:**
```bash
npm install
```

This will install all packages listed in `package.json`:
- express (web framework)
- mysql2 (MySQL driver)
- dotenv (environment variables)
- googleapis (Gmail API)
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)
- And other dependencies...

### 3. Database Setup

**Create MySQL database:**
```sql
-- Open MySQL command line or MySQL Workbench
mysql -u root -p

-- Create database
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify database was created
SHOW DATABASES;
```

### 4. Environment Configuration

**Create .env file:**
```bash
# Copy the example file
copy .env.example .env
```

**Edit .env file with your settings:**
```env
# Server
PORT=3000
NODE_ENV=development

# Database (Update with your MySQL credentials)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_system
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# JWT (Generate a strong secret key)
JWT_SECRET=your-very-long-and-secure-secret-key-minimum-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Gmail OAuth (Get from Google Cloud Console)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Default Admin (Change these!)
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
CORS_ORIGIN=http://localhost:3000
```

### 5. Gmail OAuth Setup (Optional for now)

**To set up Gmail OAuth later:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/gmail/callback`
6. Copy Client ID and Client Secret to `.env` file

### 6. Run Database Migrations

**Migrations will be created in Phase 1 implementation:**
- Migration files will be in `migrations/` folder
- They will create all necessary tables (users, roles, permissions, etc.)

### 7. Start Development Server

**Start the server:**
```bash
npm run dev
```

This uses `nodemon` which automatically restarts the server when files change.

**Or start in production mode:**
```bash
npm start
```

### 8. Verify Setup

**Check if server is running:**
- Open browser: http://localhost:3000/health
- You should see: `{"status":"OK","timestamp":"...","environment":"development"}`

**Check API health:**
- Open browser: http://localhost:3000/api/health
- You should see: `{"success":true,"message":"API is healthy",...}`

### 9. Project Structure

The project follows Clean Architecture with base classes:

```
crm-system/
├── base/              # Base classes (BaseModel, BaseRepository, BaseService, BaseController)
├── config/            # Configuration files
├── models/            # Data models (to be created)
├── repositories/      # Data access layer (to be created)
├── services/          # Business logic layer (to be created)
├── controllers/       # API controllers (to be created)
├── routes/            # API routes
├── middleware/        # Express middleware
├── utils/             # Utility functions
├── migrations/        # Database migrations (to be created)
└── seeds/             # Database seeds (to be created)
```

### 10. Development Workflow

**When creating new features:**

1. **Create Model** (extends BaseModel)
   ```javascript
   // models/User.js
   const BaseModel = require('../base/BaseModel');
   class User extends BaseModel { ... }
   ```

2. **Create Repository** (extends BaseRepository)
   ```javascript
   // repositories/UserRepository.js
   const BaseRepository = require('../base/BaseRepository');
   class UserRepository extends BaseRepository { ... }
   ```

3. **Create Service** (extends BaseService)
   ```javascript
   // services/UserService.js
   const BaseService = require('../base/BaseService');
   class UserService extends BaseService { ... }
   ```

4. **Create Controller** (extends BaseController)
   ```javascript
   // controllers/UserController.js
   const BaseController = require('../base/BaseController');
   class UserController extends BaseController { ... }
   ```

5. **Create Routes**
   ```javascript
   // routes/user.routes.js
   router.get('/', controller.index);
   ```

### 11. Troubleshooting

**Database connection error:**
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database `crm_system` exists

**Port already in use:**
- Change PORT in `.env` file
- Or kill process using port 3000

**Module not found:**
- Run `npm install` again
- Check if package is in `package.json`

**JWT secret error:**
- Ensure JWT_SECRET in `.env` is at least 32 characters

### 12. Next Steps

After setup is complete:
1. Database migrations will be created
2. Models, Repositories, Services, Controllers will be implemented
3. Authentication system will be built
4. User management will be implemented
5. Role-based access control will be added

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Check for linting errors (if configured)
npm run lint

# Run tests (when implemented)
npm test
```

## Important Notes

- Never commit `.env` file to version control
- Always use `.env.example` as template
- Keep `JWT_SECRET` and other secrets secure
- Change default admin credentials immediately
- Use strong passwords in production

## Support

Refer to:
- `Phase1_Detailed_Requirements.txt` for Phase 1 requirements
- `CRM_Development_Phases.txt` for overall project plan
- `README.md` for project overview







