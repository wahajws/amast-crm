# Quick Start - New Features

## 🚀 Getting Started with New Features

### Step 1: Run Database Migrations

```bash
npm run migrate
```

This will create:
- `password_reset_tokens` table
- New fields in `users` table (approval, lockout, etc.)

### Step 2: Configure Email (Optional)

Add to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=CRM System
FRONTEND_URL=http://localhost:3001
```

**Note:** See `EMAIL_SETUP_GUIDE.md` for detailed email setup instructions.

### Step 3: Restart Backend

```bash
npm start
```

### Step 4: Test Features

1. **Test Registration:**
   - Go to `http://localhost:3001/register`
   - Create a new account
   - Check that user appears with PENDING status

2. **Test Admin Approval:**
   - Login as admin
   - Go to Users page
   - Filter by "Pending Approval"
   - Click approve/reject buttons

3. **Test Password Reset:**
   - Go to login page
   - Click "Forgot password?"
   - Enter email
   - Check email for reset link (if SMTP configured)
   - Use reset link to change password

4. **Test Account Lockout:**
   - Try wrong password 5 times
   - Account should lock for 30 minutes
   - Try correct password after lockout expires

---

## ✅ Features Summary

### What's New:

1. ✅ **Forgot Password** - Users can reset their password via email
2. ✅ **User Registration** - New users can register (requires admin approval)
3. ✅ **Admin Approval System** - Admins approve/reject new users
4. ✅ **Password Strength Validation** - Enforces strong passwords
5. ✅ **Account Lockout** - Locks account after 5 failed login attempts
6. ✅ **Email Notifications** - Welcome, approval, rejection, password reset emails

### New Pages:
- `/register` - User registration
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token

### New API Endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/verify-reset-token` - Verify reset token
- `POST /api/auth/reset-password` - Reset password
- `POST /api/users/:id/approve` - Approve user (Admin)
- `POST /api/users/:id/reject` - Reject user (Admin)

---

## 📝 Important Notes

1. **Email is Optional:** The system works without email configuration, but users won't receive notifications.

2. **Admin Approval Required:** New registered users cannot login until approved by an admin.

3. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

4. **Account Lockout:**
   - 5 failed attempts = 30-minute lockout
   - Automatically unlocks after lockout period

---

## 🎯 Next Steps

After testing, you can:
1. Configure email for production
2. Customize email templates
3. Adjust lockout settings (in `AuthService.js`)
4. Add more security features as needed







