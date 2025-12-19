# Fix Gmail Send Permission Error

## Problem
You're getting a "403 Insufficient Permission" error when trying to send email replies. This happens because your Gmail OAuth token doesn't have the `gmail.send` scope.

## Solution

### Step 1: Update Gmail OAuth Scopes
The Gmail configuration has been updated to include the required scopes:
- `gmail.send` - Send emails
- `gmail.compose` - Compose emails
- `gmail.modify` - Modify emails (for sending)

### Step 2: Re-authenticate with Gmail
**IMPORTANT:** You must re-authenticate with Gmail to get the new scopes. Your existing token only has read-only permissions.

#### Option A: Re-authenticate via the App
1. **Log out** of the CRM application
2. **Log back in** using "Continue with Gmail" button
3. Google will show a new consent screen asking for additional permissions
4. **Approve** the new permissions (Send, Compose, Modify emails)
5. You should now be able to send email replies

#### Option B: Force Re-authentication (Recommended)
1. Go to your Google Account settings: https://myaccount.google.com/permissions
2. Find your CRM application in the list
3. **Remove/Revoke** the access
4. Go back to your CRM app
5. Log out and log back in with Gmail
6. Approve all the new permissions

### Step 3: Verify Scopes
After re-authenticating, your token should have these scopes:
- ✅ `gmail.readonly` - Read emails
- ✅ `gmail.send` - Send emails
- ✅ `gmail.compose` - Compose emails
- ✅ `gmail.modify` - Modify emails

## Why This Happens
When you first authenticated with Gmail, the app only requested read-only permissions. To send emails, we need additional permissions that require a new OAuth consent flow.

## Testing
After re-authenticating:
1. Go to any email in the timeline
2. Click "Reply"
3. Compose and send a reply
4. It should work without the 403 error

## Note
If you're using a Google Workspace account, your administrator may need to approve the additional scopes first.





