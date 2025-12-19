# Gmail Integration - User Guide

## How to View Your Gmail Contacts and Emails

After logging in with Gmail, follow these steps to sync and view your emails:

### Step 1: Go to Gmail Integration Page

1. Click on **"Gmail Integration"** in the sidebar (or navigate to `/gmail`)
2. This page shows all your Gmail labels/folders

### Step 2: Sync Your Gmail Labels

1. Click the **"Sync Labels"** button to fetch all your Gmail labels from Gmail
2. Wait for the labels to load - you'll see all your Gmail labels (INBOX, SENT, and any custom labels you created)

### Step 3: Select Labels to Sync

1. For each label you want to sync emails from, check the **"Sync"** checkbox
2. For example:
   - Check "INBOX" to sync emails from your inbox
   - Check any custom labels (like customer names) to sync emails from those folders
3. The system will only sync emails from labels you've selected

### Step 4: Sync Your Emails

1. Click the **"Sync Emails"** button
2. The system will start syncing emails from all selected labels
3. This may take a few minutes depending on how many emails you have
4. You'll see a success message when sync starts

### Step 5: View Your Emails

1. Click on **"Emails"** in the sidebar (or navigate to `/emails`)
2. You'll see all your synced emails listed
3. Click on any email to view its full content
4. You can:
   - Search emails
   - Filter by unlinked emails
   - Star/unstar emails
   - Link emails to contacts or accounts
   - Delete emails

### Step 6: Link Emails to Contacts/Accounts

1. Open an email detail page
2. In the sidebar, you'll see options to link the email to:
   - A contact (by selecting from dropdown)
   - An account (by selecting from dropdown)
3. Once linked, the email will appear in the contact's or account's activity timeline

## Features Available

### Gmail Integration Page (`/gmail`)
- View all Gmail labels
- Select which labels to sync
- Sync labels from Gmail
- Start email sync

### Emails Page (`/emails`)
- List all synced emails
- Search emails
- Filter by unlinked emails
- View email details
- Star/unstar emails
- Delete emails

### Email Detail Page (`/emails/:id`)
- View full email content (HTML/text)
- See email metadata (from, date, etc.)
- Link email to contacts or accounts
- View linked contact/account information

## Important Notes

1. **First Time Setup**: You need to sync labels first, then select which ones to sync, then sync emails
2. **Automatic Matching**: Emails are automatically matched to contacts if the sender's email matches a contact's email
3. **Manual Linking**: You can manually link emails to contacts or accounts from the email detail page
4. **Sync Frequency**: Currently, email sync is manual. You need to click "Sync Emails" to get new emails. (Automatic background sync will be added later)

## Troubleshooting

### "Gmail account not connected" error
- Make sure you logged in with Gmail OAuth
- Your Gmail tokens should be stored in your user account

### No labels showing
- Click "Sync Labels" to fetch labels from Gmail
- Make sure your Gmail account is properly connected

### No emails after syncing
- Make sure you've selected at least one label to sync
- Check that the selected labels have emails in them
- Try syncing again after a few moments

### Emails not matching to contacts
- Emails are matched by sender email address
- If a contact doesn't exist with that email, the email will remain unlinked
- You can manually link emails from the email detail page

---

**Enjoy managing your Gmail emails in your CRM!** 🎉







