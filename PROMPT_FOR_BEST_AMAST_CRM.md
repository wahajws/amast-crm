# PROMPT: Build the Best AMAST CRM System

## 🎯 Project Overview

Build a **world-class, enterprise-grade CRM (Customer Relationship Management) system** named **"AMAST CRM"** with a comprehensive admin portal. This system should be production-ready, scalable, secure, and follow industry best practices. **NO HARDCODED VALUES** - everything must be configurable through environment variables, database settings, or admin panel.

---

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js (latest LTS version)
- **Framework**: Express.js
- **Database**: MySQL 8.0+ with connection pooling
- **Architecture Pattern**: Clean Architecture with MVC
- **Authentication**: JWT with refresh tokens
- **API Style**: RESTful API with consistent response format

### Frontend Stack
- **Framework**: React 18+ with hooks
- **Routing**: React Router 6
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite
- **State Management**: React Context API + hooks
- **HTTP Client**: Axios with interceptors

### Architecture Requirements
- **Base Classes**: Implement base classes with inheritance:
  - `BaseModel` - All data models extend this
  - `BaseRepository` - All data access layers extend this
  - `BaseService` - All business logic layers extend this
  - `BaseController` - All API controllers extend this
- **Separation of Concerns**: Strict separation between:
  - Controllers (API endpoints)
  - Services (Business logic)
  - Repositories (Data access)
  - Models (Data structures)
- **Dependency Injection**: Use dependency injection pattern
- **Error Handling**: Centralized error handling middleware
- **Logging**: Structured logging system (Winston)
- **Validation**: Request validation on all endpoints

---

## 🎨 Design & UI Requirements

### Design Philosophy
- **Modern & Premium**: Clean, elegant, professional design
- **Industrial Standard**: UI/UX that meets enterprise software standards
- **AMAST Branding**: Incorporate AMAST logo and brand colors throughout
- **Glass-morphism**: Use backdrop blur effects and glass-like components
- **Gradient Backgrounds**: Subtle gradients for depth
- **Smooth Animations**: Transitions and hover effects
- **Responsive**: Mobile-first, works on all screen sizes
- **Accessibility**: WCAG 2.1 AA compliance

### Color Scheme
- **Primary**: Blue gradient (configurable)
- **Secondary**: Slate/Gray tones
- **Accent Colors**: For status indicators, badges, alerts
- **All colors must be configurable** via theme system

### Component Library
- Reusable UI components
- Consistent spacing and typography
- Custom shadows and effects
- Loading states and skeletons
- Toast notifications
- Modal dialogs
- Form inputs with validation
- Data tables with sorting/filtering
- Pagination components

---

## 👥 User Management & Authentication

### Authentication Methods
- Email/Password login
- Gmail OAuth2 integration
- JWT token-based authentication
- Refresh token mechanism
- Session management
- Password reset flow
- Forgot password functionality
- Account lockout after failed attempts
- Password strength validation (configurable rules)

### User Registration
- User registration with email verification
- Admin approval workflow (configurable)
- Registration token system
- Email verification required
- Configurable approval process

### User Roles (Configurable via Admin Portal)
1. **Super Admin**
   - Full system control
   - Cannot be deleted or demoted
   - Access to all features

2. **Admin**
   - Full CRM access
   - User management (except Super Admin)
   - System settings access

3. **Manager**
   - Team management
   - View team data
   - Limited admin access

4. **User**
   - Own data only
   - Create/edit own records
   - No admin access

5. **Viewer**
   - Read-only access
   - Cannot create/edit/delete

### Role-Based Access Control (RBAC)
- **Permissions Matrix**: Fully configurable via admin portal
- **Resource-Level Permissions**: Granular control per feature
- **Owner-Based Filtering**: Users see only their data (unless admin)
- **Dynamic Permission Checks**: No hardcoded role checks

### User Features
- Profile management
- Change password
- Active sessions management
- Session revocation
- User status (Active/Inactive/Suspended)
- User approval/rejection by admin
- Bulk user operations

---

## 📊 Core CRM Features

### 1. Account Management
**Fields** (all configurable):
- Name, Industry, Website
- Phone, Email
- Billing Address (Street, City, State, Postal Code, Country)
- Shipping Address
- Description
- Annual Revenue, Number of Employees
- Status (configurable options)
- Owner assignment
- Custom fields (via admin portal)

**Features**:
- Full CRUD operations
- Search and advanced filtering
- Bulk operations
- Import/Export (CSV, Excel)
- Account hierarchy (parent/child accounts)
- Account merge functionality
- Activity timeline
- Related records view
- Email count display
- Smart email domain matching

### 2. Contact Management
**Fields** (all configurable):
- First Name, Last Name, Full Name
- Email, Phone, Mobile, Fax
- Address (Street, City, State, Postal Code, Country)
- Job Title, Department
- Account linkage
- Owner assignment
- Custom fields (via admin portal)

**Features**:
- Full CRUD operations
- Search and advanced filtering
- Bulk operations
- Import/Export (CSV, Excel)
- Duplicate detection and merging
- Contact hierarchy
- Activity timeline
- Related records view
- Email association

### 3. Notes System
**Fields**:
- Title, Content (rich text support)
- Linked to Account OR Contact (mutually exclusive)
- Created by, Updated by
- Timestamps
- **Reminder feature** (optional):
  - Reminder date and time
  - Reminder status (Pending/Completed/Cancelled)
  - Reminder notifications

**Features**:
- Full CRUD operations
- Search by title/content
- Filter by account/contact
- Filter by reminder status
- Mark reminder as complete
- Notes history/timeline
- Rich text editor
- File attachments

### 4. Reminders System
**Fields**:
- Title, Description
- Due Date and Time
- Priority (Low/Medium/High/Urgent - configurable)
- Status (Pending/Completed/Cancelled)
- Linked to Account OR Contact (mutually exclusive)
- Recurrence pattern (optional - daily/weekly/monthly/yearly)
- Notification settings

**Features**:
- Full CRUD operations
- Filter by status, priority, account, contact
- Mark as complete
- Snooze functionality
- Recurring reminders
- Email notifications (configurable)
- Upcoming reminders widget
- Overdue reminders highlighting
- Bulk operations

### 5. Opportunities Management
**Fields**:
- Name, Description
- Linked Account and Contact
- Stage (configurable pipeline stages)
- Probability (0-100%)
- Amount, Currency (multi-currency support)
- Expected Close Date
- Actual Close Date
- Owner assignment
- Status
- Custom fields

**Features**:
- Full CRUD operations
- Sales pipeline visualization
- Stage management (configurable)
- Probability tracking
- Revenue forecasting
- Win/Loss analysis
- Activity timeline
- Related records

### 6. Proposals Management
**Fields**:
- Title, Description
- Linked Opportunity, Account, Contact
- Proposal Number (auto-generated, configurable format)
- Amount, Currency
- Valid Until date
- Status (Draft/Sent/Accepted/Rejected - configurable)
- Owner assignment
- Custom fields

**Features**:
- Full CRUD operations
- Proposal templates (configurable)
- PDF generation
- Email sending
- Status tracking
- Expiration alerts
- Activity timeline

---

## 📧 Gmail Integration

### OAuth & Authentication
- Gmail OAuth2 integration
- Secure token storage (encrypted)
- Automatic token refresh
- Multiple Gmail account support per user
- Token expiry handling
- Re-authentication flow

### Gmail API Scopes
- Read emails
- Modify emails (mark read/unread, star)
- Manage labels
- Send emails/replies
- All scopes configurable

### Label Management
- List user's Gmail labels
- Enable/disable label syncing
- Auto-enable user-created labels (configurable)
- Label sync settings per user
- Label mapping to accounts/contacts

### Email Synchronization
- Sync emails from selected Gmail labels
- **Smart Matching Algorithm**:
  1. Match label name to account/contact name (fuzzy matching)
  2. Match sender email to contact email
  3. Match email domain to account website
  4. Manual linking option
- Store complete email metadata:
  - Subject, From, To, CC, BCC
  - Date, Body (plain & HTML)
  - Snippet, Read status, Starred status
  - Thread ID, Message ID
  - Attachments metadata and download URLs
- Email sync logging
- Manual and scheduled sync (configurable intervals)
- Background job processing
- Incremental sync (only new emails)
- Error handling and retry logic

### Email Management
- View all synced emails
- Email detail view with full content
- Email thread view (conversation view)
- Link/unlink emails to contacts/accounts
- Unlinked emails list
- Advanced search (subject, sender, content, date range)
- Filter by account/contact, date, status
- Smart domain matching for account emails
- **Account Email Timeline**:
  - Chronological email view per account
  - Threaded conversations
  - Visual timeline interface
- **Email Reply Functionality**:
  - Reply to emails from CRM
  - Rich text editor
  - Add attachments
  - Insert signature/initials (configurable per user)
  - Reply added to timeline automatically
  - Send via Gmail API

---

## 🎛️ Admin Portal

### System Settings (All Configurable)
- Application name and branding
- Logo upload and management
- Color scheme configuration
- Email server settings
- SMTP configuration
- Notification settings
- Security settings:
  - Password policy (min length, complexity, expiry)
  - Session timeout
  - Account lockout settings
  - Rate limiting configuration
- Feature toggles (enable/disable features)
- Maintenance mode
- Backup settings
- Integration settings

### User Management
- User CRUD operations
- Bulk user operations
- User import/export
- User approval workflow
- Role assignment
- Permission management
- User activity logs
- User statistics

### Role & Permission Management
- Role CRUD operations
- Permission matrix editor (visual)
- Custom permission creation
- Role assignment to users
- Permission inheritance
- Role templates

### Data Management
- Custom field management:
  - Add custom fields to any entity
  - Field types (text, number, date, dropdown, etc.)
  - Field validation rules
  - Field visibility rules
- Picklist management:
  - Create/edit picklist values
  - Reorder values
  - Default values
- Data import/export:
  - CSV/Excel import
  - Data mapping
  - Validation rules
  - Error handling
- Data cleanup tools:
  - Duplicate detection
  - Merge records
  - Bulk delete
  - Data archiving

### Email & Notification Settings
- Email templates management
- Template variables
- Notification preferences
- Email queue management
- Delivery status tracking

### Integration Management
- Gmail integration settings
- API key management
- Webhook configuration
- Third-party integrations
- Integration logs

### Reports & Analytics
- Custom report builder
- Report templates
- Scheduled reports
- Export formats (PDF, Excel, CSV)
- Dashboard widgets configuration
- KPI configuration

### Audit & Logging
- Activity logs
- Audit trail
- Login history
- API access logs
- Error logs
- System logs
- Log retention policies

---

## 📈 Dashboard

### Configurable Dashboard
- Drag-and-drop widget layout
- Widget types:
  - Statistics cards
  - Charts (bar, line, pie, etc.)
  - Activity timeline
  - Upcoming reminders
  - Recent records
  - Custom widgets
- Multiple dashboard views (per role)
- Dashboard templates
- Real-time updates
- Date range filters
- Export dashboard as PDF

### Default Widgets
- Total Accounts
- Total Contacts
- Total Opportunities
- Total Revenue
- Upcoming Reminders
- Recent Activity
- Sales Pipeline
- Activity Chart

---

## 🔒 Security Requirements

### Authentication Security
- JWT with configurable expiration
- Refresh token rotation
- Password hashing (bcrypt with configurable rounds)
- Account lockout (configurable attempts and duration)
- Failed login attempt tracking
- Password strength validation (configurable rules)
- Secure password reset tokens (time-limited)
- Multi-factor authentication (optional, configurable)

### API Security
- Rate limiting (configurable per endpoint)
- CORS configuration
- Security headers (Helmet.js)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- API key authentication (for integrations)
- IP whitelisting (configurable)

### Data Security
- Data encryption at rest (configurable)
- Data encryption in transit (HTTPS)
- Role-based data access
- Owner-based data filtering
- Audit trails for sensitive operations
- Data backup and recovery
- GDPR compliance features:
  - Data export
  - Data deletion
  - Consent management

---

## 🗄️ Database Requirements

### Database Design
- MySQL 8.0+ with InnoDB engine
- Normalized schema
- Foreign key constraints
- Indexes for performance
- Soft deletes (deleted_at timestamp)
- Audit fields (created_by, updated_by, created_at, updated_at)
- Migration system
- Seed data system

### Performance
- Connection pooling
- Query optimization
- Indexing strategy
- Caching layer (Redis - optional)
- Database replication (optional)

### Data Integrity
- Foreign key constraints
- Check constraints
- Unique constraints
- Data validation at database level
- Transaction support

---

## 🔌 API Requirements

### API Design
- RESTful API design
- Consistent response format:
  ```json
  {
    "success": true/false,
    "data": {},
    "message": "",
    "errors": [],
    "pagination": {}
  }
  ```
- Versioning (v1, v2, etc.)
- Pagination on all list endpoints
- Filtering and sorting
- Search functionality
- Field selection (select specific fields)
- Error handling with proper HTTP status codes
- API documentation (Swagger/OpenAPI)

### Endpoints Structure
- `/api/v1/auth/*` - Authentication
- `/api/v1/users/*` - User management
- `/api/v1/accounts/*` - Account management
- `/api/v1/contacts/*` - Contact management
- `/api/v1/notes/*` - Notes management
- `/api/v1/reminders/*` - Reminders management
- `/api/v1/opportunities/*` - Opportunities management
- `/api/v1/proposals/*` - Proposals management
- `/api/v1/gmail/*` - Gmail integration
- `/api/v1/emails/*` - Email management
- `/api/v1/admin/*` - Admin portal APIs
- `/api/v1/reports/*` - Reports and analytics

---

## 📱 Frontend Requirements

### Routing
- Protected routes (authentication required)
- Role-based route access
- Public routes (login, register, forgot password)
- 404 page
- Error boundaries

### State Management
- AuthContext for authentication state
- API service layer
- Centralized error handling
- Loading states management
- Form state management

### Forms
- Form validation (client-side and server-side)
- Error display
- Success feedback
- Auto-save (optional)
- Draft saving
- File upload support
- Rich text editor

### Data Display
- Data tables with:
  - Sorting
  - Filtering
  - Pagination
  - Bulk selection
  - Export
- Cards layout (mobile-friendly)
- List view
- Detail view
- Timeline view

### User Experience
- Loading indicators
- Skeleton screens
- Toast notifications
- Confirmation dialogs
- Modal dialogs
- Tooltips
- Help text
- Keyboard shortcuts
- Responsive design
- Offline support (optional)

---

## 🧪 Testing & Quality

### Testing Requirements
- Unit tests for services and utilities
- Integration tests for API endpoints
- Frontend component tests
- E2E tests for critical flows
- Test coverage reporting

### Code Quality
- ESLint configuration
- Prettier formatting
- Code review process
- Documentation
- TypeScript (optional but recommended)

---

## 📦 Deployment & DevOps

### Environment Configuration
- Development environment
- Staging environment
- Production environment
- Environment variables for all configurations
- No hardcoded values

### Deployment
- Docker support (optional)
- CI/CD pipeline
- Automated testing
- Database migration on deployment
- Rollback capability

### Monitoring
- Error tracking
- Performance monitoring
- Usage analytics
- Health checks
- Log aggregation

---

## 📚 Documentation Requirements

### Technical Documentation
- API documentation (Swagger)
- Database schema documentation
- Architecture documentation
- Setup instructions
- Deployment guide

### User Documentation
- User manual
- Admin guide
- Feature documentation
- FAQ
- Video tutorials (optional)

---

## 🎯 Key Principles

1. **NO HARDCODED VALUES**: Everything must be configurable
2. **Scalability**: Design for growth
3. **Security First**: Security at every layer
4. **User Experience**: Intuitive and efficient
5. **Performance**: Fast and responsive
6. **Maintainability**: Clean, documented code
7. **Extensibility**: Easy to add new features
8. **Reliability**: Error handling and recovery
9. **Accessibility**: WCAG compliance
10. **Best Practices**: Industry standards throughout

---

## 🚀 Deliverables

1. **Complete Backend API**
   - All endpoints implemented
   - Authentication and authorization
   - Gmail integration
   - Admin portal APIs

2. **Complete Frontend Application**
   - All pages and components
   - Responsive design
   - Admin portal interface
   - User interface

3. **Database Schema**
   - All tables and relationships
   - Migrations
   - Seed data

4. **Documentation**
   - Setup guide
   - API documentation
   - User manual
   - Admin guide

5. **Configuration Files**
   - Environment variables template
   - Configuration examples
   - Setup scripts

---

## ✅ Success Criteria

- ✅ All features implemented and working
- ✅ No hardcoded values (all configurable)
- ✅ Admin portal fully functional
- ✅ Gmail integration working
- ✅ Role-based access control enforced
- ✅ Responsive design on all devices
- ✅ Security best practices implemented
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ Production-ready code quality

---

## 🎨 AMAST CRM Branding

- **Application Name**: AMAST CRM
- **Logo**: AMAST logo integrated throughout
- **Color Scheme**: Professional blue gradient with slate accents
- **Typography**: Modern, clean fonts
- **Iconography**: Consistent icon set
- **Branding Elements**: Configurable via admin portal

---

**This prompt should result in a world-class, enterprise-ready CRM system that can compete with commercial solutions while being fully customizable and maintainable.**





