# Email Setup Guide

## Overview

The CRM system now includes email functionality for:
- Password reset emails
- Welcome emails
- Account approval/rejection notifications

## Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication:**
   - Go to your Google Account settings
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "CRM System" as the name
   - Copy the generated 16-character password

3. **Update `.env` File:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_FROM_NAME=CRM System
   FRONTEND_URL=http://localhost:3001
   ```

### Other Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```

## Testing Email Configuration

After configuring, restart your backend server. Check the logs for:
- ✅ "Email service ready" - Configuration is correct
- ⚠️ "Email service not configured" - Check your SMTP settings

## Notes

- If email is not configured, the system will still work but won't send emails
- Password reset and registration will still work, but users won't receive emails
- All email operations are logged for debugging







