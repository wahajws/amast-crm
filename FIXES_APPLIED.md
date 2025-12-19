# Fixes Applied

## Issues Fixed

### 1. ✅ Roles Table `deleted_at` Error
**Problem:** BaseRepository was trying to query `deleted_at` on roles table, but roles table doesn't have this column.

**Fix:** 
- Updated `RoleRepository` to override `findOne()` and `findAll()` methods
- These methods now don't check for `deleted_at` since roles are system roles and shouldn't be soft-deleted

### 2. ✅ Default Admin Creation
**Problem:** Default admin wasn't being created because role lookup was failing.

**Fix:**
- Updated `UserService.initializeDefaultAdmin()` to use direct SQL query instead of `findOne()` method
- This bypasses the `deleted_at` check for roles

## Next Steps

1. **Restart your server:**
   ```powershell
   npm start
   ```

2. **Check server logs** - You should see:
   - ✅ "Database connected successfully"
   - ✅ "Server running on port 3000"
   - ✅ "Default admin created: admin@crm.local" (or your email)

3. **Test login:**
   - Email: `admin@crm.local` (or your `DEFAULT_ADMIN_EMAIL`)
   - Password: `ChangeMe123!` (or your `DEFAULT_ADMIN_PASSWORD`)

## If You Still See Errors

If you see "Invalid email or password":
- The default admin might not have been created
- Check server logs for "Default admin created" message
- If not created, the SUPER_ADMIN role might be missing - run `npm run seed` again

If you see "SUPER_ADMIN role not found":
- Run: `npm run seed`
- Then restart server

## Files Modified

1. `repositories/RoleRepository.js` - Added overrides for findOne and findAll
2. `services/UserService.js` - Fixed role lookup in initializeDefaultAdmin







