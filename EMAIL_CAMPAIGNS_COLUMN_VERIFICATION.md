# Email Campaigns Column Name Verification

## Database Schema (snake_case)
All column names in `email_campaigns` table:
- `id`
- `contact_id`
- `account_id`
- `email_subject`
- `email_template`
- `status`
- `priority`
- `sent_at`
- `sent_by`
- `opened_at`
- `replied_at`
- `communication_started` (BOOLEAN)
- `scheduled_send_at`
- `notes`
- `owner_id`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

## Model Properties (camelCase)
EmailCampaign model properties (from `models/EmailCampaign.js`):
- `id`
- `contactId` ← `contact_id`
- `accountId` ← `account_id`
- `emailSubject` ← `email_subject`
- `emailTemplate` ← `email_template`
- `status`
- `priority`
- `sentAt` ← `sent_at`
- `sentBy` ← `sent_by`
- `openedAt` ← `opened_at`
- `repliedAt` ← `replied_at`
- `communicationStarted` ← `communication_started`
- `scheduledSendAt` ← `scheduled_send_at`
- `notes`
- `ownerId` ← `owner_id`
- `createdBy` ← `created_by`
- `updatedBy` ← `updated_by`
- `createdAt` ← `created_at`
- `updatedAt` ← `updated_at`

## Conversion Flow

### 1. Frontend → Backend (API Request)
- Frontend sends: `camelCase` (e.g., `emailSubject`, `communicationStarted`)
- Controller receives: `camelCase` in `req.body`
- ✅ Status: Correct

### 2. Backend Service → Database (Create/Update)
- Service uses: `mapToSnakeCase()` to convert `camelCase` → `snake_case`
- Example: `{ emailSubject: 'Test' }` → `{ email_subject: 'Test' }`
- Database stores: `snake_case`
- ✅ Status: Correct (verified in `EmailCampaignService.create()` and `update()`)

### 3. Database → Backend (Select)
- Database returns: `snake_case` columns
- `BaseModel.fromDatabaseRow()`: Automatically converts `snake_case` → `camelCase`
- Example: `{ email_subject: 'Test' }` → `{ emailSubject: 'Test' }`
- Model instance: Has `camelCase` properties
- ✅ Status: Correct (verified with test)

### 4. Backend → Frontend (API Response)
- Model `toJSON()`: Returns `camelCase` properties
- Controller: Returns model via `this.success()`
- Frontend receives: `camelCase`
- ✅ Status: Correct

## Key Files Verified

### Backend
1. **models/EmailCampaign.js**
   - ✅ Constructor accepts both `camelCase` and `snake_case`
   - ✅ Properties stored as `camelCase`
   - ✅ `getFillableFields()` returns `snake_case` (for database)
   - ✅ `fromDatabaseRow()` converts automatically

2. **services/EmailCampaignService.js**
   - ✅ Uses `mapToSnakeCase()` before database operations
   - ✅ `markAsSent()` uses `camelCase` → converted to `snake_case`
   - ✅ `toggleCommunicationStarted()` uses `camelCase` → converted to `snake_case`
   - ✅ Returns model instances (`camelCase`)

3. **repositories/EmailCampaignRepository.js**
   - ✅ SQL queries use `snake_case` column names
   - ✅ Uses `EmailCampaign.fromDatabaseRow()` for conversion
   - ✅ Joins use correct table aliases and column names

4. **controllers/EmailCampaignController.js**
   - ✅ Receives `camelCase` from `req.body`
   - ✅ Returns model instances directly (`camelCase`)

5. **services/BulkImportService.js**
   - ✅ Creates campaigns with `camelCase` properties
   - ✅ Passes to `EmailCampaignService.create()` which converts

### Frontend
1. **pages/EmailCampaigns/EmailCampaigns.jsx**
   - ✅ Uses `camelCase` properties: `campaign.emailSubject`, `campaign.communicationStarted`, `campaign.sentAt`, `campaign.sentByUser`
   - ✅ Sends `camelCase` in API requests

2. **pages/EmailCampaigns/EmailCampaignDetail.jsx**
   - ✅ Uses `camelCase` properties
   - ✅ Sends `camelCase` in update requests

3. **pages/EmailDashboard/EmailDashboard.jsx**
   - ✅ Uses `camelCase` properties from API responses

## Special Field Handling

### Boolean Fields
- `communication_started` (database) ↔ `communicationStarted` (model/frontend)
- ✅ Correctly converted by `mapToSnakeCase()` and `fromDatabaseRow()`

### Date Fields
- `sent_at`, `opened_at`, `replied_at`, `scheduled_send_at` (database)
- ↔ `sentAt`, `openedAt`, `repliedAt`, `scheduledSendAt` (model/frontend)
- ✅ Correctly converted

### Foreign Keys
- `contact_id`, `account_id`, `sent_by`, `owner_id`, `created_by`, `updated_by` (database)
- ↔ `contactId`, `accountId`, `sentBy`, `ownerId`, `createdBy`, `updatedBy` (model/frontend)
- ✅ Added to `integerFields` in `fieldMapper.js` for proper type conversion

## Verification Tests

### Test 1: Model Conversion
```javascript
const test = EmailCampaign.fromDatabaseRow({
  contact_id: 1,
  email_subject: 'Test',
  communication_started: 1,
  sent_at: '2024-01-01',
  sent_by: 2
});
// Result: ✅ All fields correctly converted to camelCase
```

### Test 2: Field Mapping
```javascript
const mapped = mapToSnakeCase({
  contactId: 1,
  emailSubject: 'Test',
  communicationStarted: true,
  sentBy: 2
});
// Result: ✅ All fields correctly converted to snake_case
```

## Conclusion

✅ **All column name mappings are correct and consistent throughout the codebase.**

- Database uses `snake_case`
- Models and API use `camelCase`
- Conversion happens automatically via:
  - `mapToSnakeCase()` for database writes
  - `BaseModel.fromDatabaseRow()` for database reads
- Frontend consistently uses `camelCase`
- No column name mismatches detected

