# Database Setup Guide

## Quick Setup Steps

### Step 1: Run Database Migrations

This will create all necessary tables:

```powershell
npm run migrate
```

This runs all SQL files in the `migrations/` folder:
- `001_create_roles_table.sql` - Creates roles table
- `002_create_permissions_table.sql` - Creates permissions table
- `003_create_users_table.sql` - Creates users table
- `004_create_role_permissions_table.sql` - Creates role_permissions table
- `005_create_user_sessions_table.sql` - Creates user_sessions table
- `006_create_audit_logs_table.sql` - Creates audit_logs table

### Step 2: Seed Default Data

This will populate default roles:

```powershell
npm run seed
```

This runs all SQL files in the `seeds/` folder:
- `001_seed_roles.sql` - Seeds default roles (SUPER_ADMIN, ADMIN, MANAGER, USER, VIEWER)

### Step 3: Restart Server

After migrations and seeds, restart your server:

```powershell
npm run dev
```

The server will automatically create the default admin user on startup (if it doesn't exist).

## Default Admin Credentials

After running migrations, seeds, and starting the server, you can login with:

- **Email:** `admin@crm.local` (or whatever you set in `.env` as `DEFAULT_ADMIN_EMAIL`)
- **Password:** `ChangeMe123!` (or whatever you set in `.env` as `DEFAULT_ADMIN_PASSWORD`)

**⚠️ IMPORTANT:** Change the default password after first login!

## Troubleshooting

### Migration fails with "Table already exists"
- Tables already exist, that's okay
- You can continue to seed step

### Seed fails with "Duplicate entry"
- Roles already exist, that's okay
- Default admin will still be created on server start

### Default admin not created
- Check that SUPER_ADMIN role exists (run seed again)
- Check `.env` file has `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`
- Check server logs for errors

## Manual Setup (Alternative)

If you prefer to run SQL manually:

1. Open MySQL command line or MySQL Workbench
2. Connect to your database
3. Run each migration file in order:
   ```sql
   -- Run each file in migrations/ folder in order
   SOURCE migrations/001_create_roles_table.sql;
   SOURCE migrations/002_create_permissions_table.sql;
   -- etc...
   ```
4. Run seed files:
   ```sql
   SOURCE seeds/001_seed_roles.sql;
   ```

## Verify Setup

After setup, you can verify:

1. **Check tables exist:**
   ```sql
   SHOW TABLES;
   ```
   Should show: roles, permissions, users, role_permissions, user_sessions, audit_logs

2. **Check roles exist:**
   ```sql
   SELECT * FROM roles;
   ```
   Should show 5 roles: SUPER_ADMIN, ADMIN, MANAGER, USER, VIEWER

3. **Check default admin:**
   ```sql
   SELECT email, first_name, last_name, status FROM users WHERE email = 'admin@crm.local';
   ```
   Should show the default admin user

## Next Steps

After database is set up:
1. ✅ Authentication endpoints will work
2. ✅ You can login with default admin
3. ✅ Frontend can connect to backend
4. ⏳ Continue implementing user management
5. ⏳ Continue implementing role management







