# Seeding Mock Data

This guide explains how to seed mock/test data into your CRM system.

## What Mock Data Includes

The mock data seed file (`seeds/002_seed_mock_data.sql`) includes:

- **5 Sample Accounts** (Companies):
  - Acme Corporation (Technology)
  - Global Industries Ltd (Manufacturing)
  - TechStart Solutions (Software)
  - MediCare Systems (Healthcare)
  - FinanceFirst Group (Financial Services)

- **8 Sample Contacts** (People):
  - Linked to various accounts
  - Different roles (CEO, VP Sales, CTO, etc.)

- **5 Sample Opportunities**:
  - Various stages (Prospecting, Qualification, Proposal, Negotiation, Closed Won)
  - Different amounts and close dates
  - Linked to accounts and contacts

- **5 Sample Proposals**:
  - Different statuses (Draft, Sent, Reviewed, Approved, Accepted)
  - Linked to opportunities, accounts, and contacts

- **6 Sample Notes**:
  - Linked to both contacts and accounts
  - Various types of notes

- **7 Sample Reminders**:
  - Different priorities (High, Medium, Low)
  - Various due dates
  - Linked to contacts and accounts

## How to Seed Mock Data

### Option 1: Run Mock Data Seed Script (Recommended)

The easiest way to seed mock data is using the dedicated Node.js script:

```bash
npm run seed:mock
```

Or directly:

```bash
node utils/seedMockData.js
```

This script handles all relationships and foreign keys properly.

### Option 2: Run All Seeds (Including Mock Data SQL)

```bash
npm run seed
```

This will run all SQL seed files including the mock data SQL file.

### Option 3: Skip Mock Data

If you want to seed only the base data (roles) and skip mock data:

1. Set environment variable:
   ```bash
   # In your .env file
   SKIP_MOCK_DATA=true
   ```

2. Run seeds:
   ```bash
   npm run seed
   ```

## Default Admin User

The mock data is linked to the default admin user created during initial setup:
- **Email**: `admin@crm.com`
- **Password**: Check your `.env` file for `DEFAULT_ADMIN_PASSWORD`

If the admin user doesn't exist, the seed will use user ID 1.

## Notes

- Mock data will not overwrite existing data
- If you run the seed multiple times, it will create duplicate entries
- To reset and reseed, you may need to manually delete existing records or reset the database
- The mock data is linked to the default admin user (`admin@crm.com`)
- All relationships (accounts → contacts → opportunities → proposals) are properly maintained

## Testing with Mock Data

After seeding, you can:

1. **View Accounts**: Go to `/accounts` to see the 5 sample companies
2. **View Contacts**: Go to `/contacts` to see the 8 sample contacts
3. **View Opportunities**: Go to `/opportunities` to see the 5 sample opportunities
4. **View Proposals**: Go to `/proposals` to see the 5 sample proposals
5. **View Notes**: Go to `/notes` to see the 6 sample notes
6. **View Reminders**: Go to `/reminders` to see the 7 sample reminders

All mock data is linked together, so you can test relationships:
- Contacts are linked to Accounts
- Opportunities are linked to Accounts and Contacts
- Proposals are linked to Opportunities, Accounts, and Contacts
- Notes and Reminders are linked to both Contacts and Accounts

