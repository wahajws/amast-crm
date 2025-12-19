# AMAST CRM System

A comprehensive Customer Relationship Management (CRM) system built with Node.js, Express, React, and MySQL.

## Features

- **Lead Generation**: AI-powered lead generation using Alibaba Qwen LLM and web search
- **Bulk Import**: Excel file import with automatic data enrichment and email generation
- **Email Campaigns**: Manage and track email campaigns with analytics
- **Contact Management**: Full CRUD operations for contacts and accounts
- **User Management**: Role-based access control (Admin, Manager, User, Viewer)
- **Email Integration**: Gmail sync and email management
- **Notes & Reminders**: Track interactions and set reminders
- **Opportunities & Proposals**: Manage sales pipeline

## Tech Stack

### Backend
- Node.js & Express
- MySQL Database
- JWT Authentication
- Alibaba Qwen LLM Integration
- Serper API / Google Custom Search API

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

## Setup

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone git@github.com:wahajws/amast-crm.git
cd amast-crm
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=crm_system

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Alibaba Qwen LLM
ALIBABA_LLM_API_KEY=your_qwen_api_key
ALIBABA_LLM_API_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
ALIBABA_LLM_API_MODEL=qwen-plus

# Serper API (Optional)
SERPER_API_KEY=your_serper_api_key

# Google Custom Search (Optional)
GOOGLE_CSE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_cse_id

# Server
PORT=3000
NODE_ENV=development
```

5. Run database migrations:
```bash
npm run migrate
```

6. Start the backend server:
```bash
npm start
```

7. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## Default Credentials

- **Username**: admin
- **Password**: ChangeMe123! (change on first login)

## API Endpoints

- `/api/auth` - Authentication
- `/api/accounts` - Account management
- `/api/contacts` - Contact management
- `/api/lead-generation` - Lead generation
- `/api/bulk-import` - Bulk import
- `/api/email-campaigns` - Email campaigns
- `/api/emails` - Email management
- `/api/gmail` - Gmail integration

## License

Proprietary - All rights reserved
