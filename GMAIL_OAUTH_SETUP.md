# How to Find Gmail OAuth Credentials

## Lines 14-16 in .env file refer to:

```env
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

## Step-by-Step Guide to Get Gmail OAuth Credentials

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project (or Select Existing)

1. Click on the project dropdown at the top
2. Click **"New Project"**
3. Enter project name: `CRM System` (or any name you prefer)
4. Click **"Create"**
5. Wait for project creation, then select the project

### Step 3: Enable Gmail API

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"**
4. Click **"Enable"** button
5. Wait for it to enable

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"** (in left sidebar)
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

### Step 5: Configure OAuth Consent Screen (First Time Only)

If this is your first time, you'll need to configure the consent screen:

1. Click **"Configure Consent Screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: `CRM System` (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On **Scopes** page, click **"Save and Continue"** (we'll add scopes later)
7. On **Test users** page, click **"Save and Continue"**
8. On **Summary** page, click **"Back to Dashboard"**

### Step 6: Create OAuth Client ID

1. Go back to **"Credentials"** > **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
2. Select **Application type**: **"Web application"**
3. Enter **Name**: `CRM System Web Client` (or any name)
4. Under **Authorized redirect URIs**, click **"+ ADD URI"**
5. Add: `http://localhost:3000/api/auth/gmail/callback`
6. Click **"Create"**

### Step 7: Copy Your Credentials

After clicking "Create", a popup will show:
- **Your Client ID** - Copy this (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
- **Your Client secret** - Copy this (looks like: `GOCSPX-abcdefghijklmnop`)

**⚠️ IMPORTANT:** Copy these immediately! You won't be able to see the secret again.

### Step 8: Add to .env File

Update your `.env` file:

```env
GMAIL_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

### Step 9: Configure OAuth Scopes (Important!)

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Click **"Edit App"**
3. Go to **"Scopes"** tab
4. Click **"+ ADD OR REMOVE SCOPES"**
5. Add these scopes (required for reading AND sending emails):
   - `https://www.googleapis.com/auth/gmail.readonly` - Read emails
   - `https://www.googleapis.com/auth/gmail.send` - Send emails ⚠️ **REQUIRED FOR REPLIES**
   - `https://www.googleapis.com/auth/gmail.compose` - Compose emails
   - `https://www.googleapis.com/auth/gmail.modify` - Modify emails
   - `https://www.googleapis.com/auth/userinfo.email` - User email
   - `https://www.googleapis.com/auth/userinfo.profile` - User profile
6. Click **"Update"** > **"Save and Continue"**

### Step 10: Add Test Users (For Development)

1. In **"OAuth consent screen"**, go to **"Test users"** tab
2. Click **"+ ADD USERS"**
3. Add your Gmail address (the one you'll use to test)
4. Click **"Add"**

## Quick Reference

| Value | Where to Find |
|-------|---------------|
| **GMAIL_CLIENT_ID** | Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs |
| **GMAIL_CLIENT_SECRET** | Same place (shown only once when created) |
| **GMAIL_REDIRECT_URI** | Fixed: `http://localhost:3000/api/auth/gmail/callback` |

## For Production

When deploying to production:
1. Update **Authorized redirect URIs** in Google Cloud Console to include your production URL
2. Update `GMAIL_REDIRECT_URI` in production `.env` file
3. Publish your OAuth consent screen (if ready for public use)

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console **exactly matches** the one in `.env`
- Check for trailing slashes, http vs https, etc.

### "Access blocked" error
- Make sure you added your email as a test user
- Check that OAuth consent screen is configured

### Can't see Client Secret
- You can only see it once when created
- If lost, delete and create a new OAuth client ID

## Visual Guide Locations

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **Credentials Page**: APIs & Services > Credentials
3. **OAuth Consent Screen**: APIs & Services > OAuth consent screen
4. **Gmail API**: APIs & Services > Library > Search "Gmail API"

## Notes

- **For Development**: You can use test mode (no verification needed)
- **For Production**: You'll need to verify your app with Google
- **Client Secret**: Keep this secure! Never commit to version control
- **Redirect URI**: Must match exactly between Google Console and your `.env` file



