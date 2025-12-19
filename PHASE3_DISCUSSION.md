# Phase 3: Gmail Integration & Advanced Features - Discussion Document

## Overview

Phase 3 focuses on integrating Gmail with the CRM system to sync emails, link them to contacts/accounts, and add advanced features for a complete CRM experience.

---

## Current State (What We Already Have)

### ✅ Completed in Phase 1:
- **Gmail OAuth Login**: Users can authenticate with Gmail
- **Token Storage**: Gmail access tokens and refresh tokens are stored in `users` table
- **Basic GmailService**: OAuth flow, token refresh, user info retrieval
- **Gmail Scopes**: Currently requesting `gmail.readonly`, `userinfo.email`, `userinfo.profile`

### ✅ Completed in Phase 2:
- **Core CRM Features**: Accounts, Contacts, Notes, Reminders, Opportunities, Proposals
- **Database Structure**: All necessary tables for CRM entities

---

## Phase 3 Proposed Features

### 1. **Gmail Token Management Enhancement** 🔐
**Current**: Tokens stored in `users` table, basic refresh mechanism  
**Phase 3 Goals**:
- Enhanced token refresh (automatic background refresh before expiry)
- Token validation and error handling
- Support for multiple Gmail accounts per user (if needed)
- Token expiry notifications

**Database Changes**:
- May need a separate `gmail_connections` table if supporting multiple accounts
- Or enhance existing `users` table columns

**Questions for Discussion**:
- Do we need multiple Gmail accounts per user, or one Gmail account per user?
- How should we handle token expiry? Auto-refresh or prompt user?

---

### 2. **Gmail Labels/Folders Reading** 📁
**Goal**: Read user's Gmail labels (folders) and display them in CRM

**Features**:
- List all Gmail labels/folders via Gmail API
- Display labels in CRM interface (Settings/Email Integration page)
- Allow user to select which labels to sync
- Store user's label preferences

**Database Changes**:
- New table: `gmail_label_sync_settings`
  - `user_id` (FK to users)
  - `label_id` (Gmail label ID)
  - `label_name` (Gmail label name)
  - `is_syncing` (boolean - user selected this label)
  - `last_synced_at` (timestamp)
  - `created_at`, `updated_at`

**API Endpoints Needed**:
- `GET /api/gmail/labels` - List all user's Gmail labels
- `POST /api/gmail/labels/sync` - Update which labels to sync
- `GET /api/gmail/labels/sync-status` - Get sync status

**Questions for Discussion**:
- Should we sync ALL labels by default, or require user to select?
- How to handle Gmail's system labels (INBOX, SENT, etc.) vs custom labels?

---

### 3. **Email Sync System** 📧
**Goal**: Sync emails from selected Gmail labels and store them in CRM

**Features**:
- **Manual Sync**: User triggers sync via button
- **Automatic Sync**: Background job (cron) syncs periodically (e.g., every 15 minutes)
- **Incremental Sync**: Only sync new emails since last sync
- **Email Matching**: Match emails to contacts/accounts based on:
  - Sender email address → Contact email
  - Gmail label name → Account/Contact name (auto-create if needed)
  - Email domain → Account domain

**Database Changes**:
- New table: `emails`
  - `id` (PK)
  - `gmail_message_id` (Gmail's message ID - unique)
  - `thread_id` (Gmail thread ID)
  - `subject`
  - `from_email`
  - `from_name`
  - `to_email` (JSON array for multiple recipients)
  - `cc_email` (JSON array)
  - `bcc_email` (JSON array)
  - `body_text` (plain text)
  - `body_html` (HTML content)
  - `received_at` (timestamp)
  - `sent_at` (timestamp)
  - `is_read` (boolean)
  - `is_starred` (boolean)
  - `label_ids` (JSON array - Gmail label IDs)
  - `attachment_count` (integer)
  - `contact_id` (FK to contacts - nullable)
  - `account_id` (FK to accounts - nullable)
  - `user_id` (FK to users - owner)
  - `created_at`, `updated_at`, `deleted_at`

- New table: `email_attachments`
  - `id` (PK)
  - `email_id` (FK to emails)
  - `gmail_attachment_id` (Gmail attachment ID)
  - `filename`
  - `mime_type`
  - `size` (bytes)
  - `download_url` (temporary URL or stored path)
  - `created_at`

- New table: `email_sync_logs`
  - `id` (PK)
  - `user_id` (FK to users)
  - `label_id` (Gmail label ID)
  - `sync_type` (manual/automatic)
  - `status` (success/failed)
  - `emails_synced` (count)
  - `error_message` (if failed)
  - `started_at`, `completed_at`

**API Endpoints Needed**:
- `POST /api/gmail/sync` - Trigger manual sync
- `GET /api/gmail/sync/status` - Get sync status
- `GET /api/gmail/sync/history` - Get sync history/logs

**Background Job**:
- Use `node-cron` (already in dependencies) for scheduled syncs
- Create `jobs/emailSyncJob.js`
- Run every 15 minutes (configurable)

**Questions for Discussion**:
- How often should automatic sync run? (15 min, 30 min, 1 hour?)
- Should we sync email body content or just metadata initially?
- How to handle large email volumes? (Pagination, limits?)
- Should we store email attachments in database or just metadata?

---

### 4. **Email-Contact/Account Matching** 🔗
**Goal**: Automatically link synced emails to contacts/accounts

**Matching Logic**:
1. **By Email Address**: Match `from_email` to `contacts.email`
2. **By Label Name**: Match Gmail label name to `accounts.name` or `contacts.first_name + last_name`
3. **By Domain**: Match email domain to account website domain
4. **Manual Linking**: Allow user to manually link emails to contacts/accounts

**Features**:
- Auto-create contacts if email from unknown sender (optional setting)
- Auto-create accounts if label matches new account name (optional setting)
- Show "Unlinked Emails" section for emails that couldn't be matched
- Bulk linking interface

**Database Changes**:
- `emails` table already has `contact_id` and `account_id` (see above)

**API Endpoints Needed**:
- `POST /api/emails/:id/link` - Manually link email to contact/account
- `GET /api/emails/unlinked` - Get unlinked emails
- `POST /api/emails/bulk-link` - Bulk link multiple emails

**Questions for Discussion**:
- Should we auto-create contacts/accounts from emails, or require manual creation?
- What matching confidence threshold? (Exact match only, or fuzzy matching?)

---

### 5. **Email Management in CRM** 📬
**Goal**: View and manage emails within CRM interface

**Features**:
- **Email List View**: 
  - List all emails (paginated)
  - Filter by contact, account, date range, label
  - Search emails (subject, body, sender)
  - Sort by date, sender, subject

- **Email Detail View**:
  - Full email content (HTML/text)
  - Email thread/conversation view
  - Attachments list and download
  - Related notes and reminders
  - Link to contact/account

- **Email Threading**:
  - Group emails by Gmail thread_id
  - Show conversation timeline
  - Display reply chain

- **Email Actions**:
  - Mark as read/unread
  - Star/unstar
  - Link to contact/account
  - Create note from email
  - Create reminder from email
  - Delete email (soft delete)

**Database Changes**:
- Use existing `emails` table
- May need `email_threads` table if we want to store thread metadata separately

**API Endpoints Needed**:
- `GET /api/emails` - List emails (with filters, pagination, search)
- `GET /api/emails/:id` - Get single email with full details
- `GET /api/emails/thread/:threadId` - Get email thread
- `PUT /api/emails/:id` - Update email (read status, starred, etc.)
- `DELETE /api/emails/:id` - Soft delete email
- `GET /api/emails/:id/attachments` - Get email attachments
- `GET /api/emails/:id/attachments/:attachmentId/download` - Download attachment

**Frontend Pages Needed**:
- `/emails` - Email list page
- `/emails/:id` - Email detail page
- `/contacts/:id/emails` - Emails for a contact
- `/accounts/:id/emails` - Emails for an account

**Questions for Discussion**:
- Should we display emails in a Gmail-like interface or simpler list?
- Do we need email composition (send emails from CRM) or just viewing?

---

### 6. **Activity Timeline** 📅
**Goal**: Unified timeline showing all activities (notes, emails, reminders)

**Features**:
- Show all activities chronologically
- Filter by type (notes, emails, reminders)
- Filter by contact/account
- Activity icons and colors
- Click to view details

**Database Changes**:
- May need `activity_logs` table or use UNION queries from existing tables
- Or create a view that combines notes, emails, reminders

**API Endpoints Needed**:
- `GET /api/activities` - Get activity timeline
- `GET /api/contacts/:id/activities` - Activities for a contact
- `GET /api/accounts/:id/activities` - Activities for an account

**Frontend Pages Needed**:
- Update contact detail page to show activity timeline
- Update account detail page to show activity timeline
- Global activity timeline page (optional)

**Questions for Discussion**:
- Should this be a separate page or integrated into contact/account detail pages?
- How far back should we show activities? (Last 30 days, all time?)

---

### 7. **Advanced Search** 🔍
**Goal**: Global search across all entities

**Features**:
- Search across: Contacts, Accounts, Emails, Notes, Reminders, Opportunities, Proposals
- Full-text search in email bodies, notes content
- Filter by entity type
- Filter by date range
- Highlight search results

**Database Changes**:
- May need full-text indexes on `emails.body_text`, `notes.content`
- Or use MySQL FULLTEXT search

**API Endpoints Needed**:
- `GET /api/search?q=query&type=all|contacts|accounts|emails|notes` - Global search

**Frontend Components Needed**:
- Global search bar in header
- Search results page with tabs for each entity type

**Questions for Discussion**:
- Should we use MySQL FULLTEXT or implement search with Elasticsearch later?
- What's the minimum search result count to show?

---

### 8. **Enhanced Reminders** ⏰
**Goal**: Advanced reminder features

**Features**:
- **Recurring Reminders**: Daily, weekly, monthly, yearly
- **Email-based Reminders**: Remind about unread emails from specific contacts
- **Email Notifications**: Send email when reminder is due
- **Reminder Dashboard Widget**: Enhanced widget on dashboard

**Database Changes**:
- Add to `reminders` table:
  - `recurrence_pattern` (JSON: {type: 'daily|weekly|monthly|yearly', interval: 1, days: [1,2,3]})
  - `next_reminder_at` (calculated next occurrence)
  - `email_notification_enabled` (boolean)
  - `last_reminded_at` (timestamp)

**API Endpoints Needed**:
- `PUT /api/reminders/:id/recurrence` - Set recurrence
- `POST /api/reminders/:id/snooze` - Snooze reminder
- `GET /api/reminders/upcoming` - Already exists, may need enhancement

**Questions for Discussion**:
- How complex should recurrence be? (Simple patterns or advanced like "every 2nd Monday")?
- Should email notifications be mandatory or optional?

---

### 9. **Data Export** 📊
**Goal**: Export CRM data

**Features**:
- Export contacts to CSV
- Export accounts to CSV
- Export emails to CSV
- Export all data to JSON
- Scheduled exports (optional)

**API Endpoints Needed**:
- `GET /api/export/contacts?format=csv`
- `GET /api/export/accounts?format=csv`
- `GET /api/export/emails?format=csv`
- `GET /api/export/all?format=json`

**Questions for Discussion**:
- What fields should be included in exports?
- Should exports be async (generate file, email link) or sync (direct download)?

---

### 10. **Email Templates** (Optional) 📝
**Goal**: Pre-defined email templates for common communications

**Features**:
- Create email templates
- Use templates when composing emails (if we add email sending)
- Template variables (contact name, account name, etc.)

**Database Changes**:
- New table: `email_templates`
  - `id`, `name`, `subject`, `body`, `user_id`, `created_at`, `updated_at`

**Questions for Discussion**:
- Do we need email sending capability in Phase 3, or just viewing?
- If we add sending, we'll need Gmail API `send` scope

---

## Technical Considerations

### Gmail API Rate Limits
- **Quota**: 1,000,000,000 quota units per day (default)
- **Per-user rate limits**: 250 quota units per user per second
- **Email list**: 5 quota units per request
- **Email get**: 5 quota units per request
- **Labels list**: 1 quota unit per request

**Strategy**:
- Implement exponential backoff for rate limit errors
- Batch requests where possible
- Cache label lists
- Use incremental sync to minimize API calls

### Performance
- **Email Storage**: Consider storing email bodies in separate table or file storage for large volumes
- **Indexing**: Add indexes on `emails.from_email`, `emails.contact_id`, `emails.account_id`, `emails.received_at`
- **Pagination**: Always paginate email lists
- **Background Jobs**: Use queue system (Bull/BullMQ) for large syncs

### Security
- **Token Encryption**: Encrypt Gmail tokens at rest (already using secure storage)
- **Scope Validation**: Ensure users can only access their own emails
- **Data Privacy**: Comply with email privacy regulations

---

## Implementation Priority

### Must Have (Core Phase 3):
1. ✅ Gmail Labels Reading & Selection
2. ✅ Email Sync System (Manual + Automatic)
3. ✅ Email-Contact/Account Matching
4. ✅ Email Management (List, Detail, Threading)
5. ✅ Activity Timeline

### Should Have (Important):
6. ✅ Advanced Search
7. ✅ Enhanced Reminders (Recurring, Email notifications)

### Nice to Have (Can be added later):
8. ⚠️ Data Export
9. ⚠️ Email Templates
10. ⚠️ Email Sending (if needed)

---

## Questions for You to Consider

1. **Email Sync Frequency**: How often should emails sync automatically? (15 min, 30 min, 1 hour?)

2. **Auto-Creation**: Should we auto-create contacts/accounts from emails, or require manual creation?

3. **Email Storage**: Should we store full email bodies in database, or just metadata with links to Gmail?

4. **Attachments**: Store attachments in database/file system, or just metadata with download links?

5. **Email Sending**: Do you need to send emails from CRM in Phase 3, or just view/sync?

6. **Multiple Gmail Accounts**: Do users need multiple Gmail accounts, or one per user?

7. **Search Implementation**: Use MySQL FULLTEXT search or plan for Elasticsearch later?

8. **Activity Timeline Scope**: Show all activities or limit to recent (e.g., last 30 days)?

9. **Recurring Reminders Complexity**: Simple patterns (daily/weekly/monthly) or advanced (custom schedules)?

10. **Export Format**: CSV only, or also JSON, Excel?

---

## Estimated Timeline

- **Gmail Labels & Sync Setup**: 2-3 days
- **Email Sync System**: 3-4 days
- **Email Matching & Linking**: 2-3 days
- **Email Management UI**: 3-4 days
- **Activity Timeline**: 2 days
- **Advanced Search**: 2-3 days
- **Enhanced Reminders**: 2 days
- **Testing & Bug Fixes**: 2-3 days

**Total**: ~18-24 days (3-4 weeks)

---

## Next Steps

Please review this document and let me know:
1. Which features are most important to you?
2. Answers to the questions above
3. Any features you'd like to add or remove
4. Any concerns or requirements I should know about

Once we align on the scope, I'll create a detailed implementation plan and start building! 🚀







