/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for all API routes
 */

const API_ENDPOINTS = {
  // Accounts
  ACCOUNTS: {
    BASE: '/accounts',
    BY_ID: (id) => `/accounts/${id}`,
    EMAILS: (id) => `/accounts/${id}/emails`,
    WITH_EMAIL_COUNTS: '/accounts/with-email-counts',
  },

  // Contacts
  CONTACTS: {
    BASE: '/contacts',
    BY_ID: (id) => `/contacts/${id}`,
    EMAILS: (id) => `/contacts/${id}/emails`,
  },

  // Opportunities
  OPPORTUNITIES: {
    BASE: '/opportunities',
    BY_ID: (id) => `/opportunities/${id}`,
  },

  // Proposals
  PROPOSALS: {
    BASE: '/proposals',
    BY_ID: (id) => `/proposals/${id}`,
  },

  // Notes
  NOTES: {
    BASE: '/notes',
    BY_ID: (id) => `/notes/${id}`,
    REMINDER_COMPLETE: (id) => `/notes/${id}/reminder-complete`,
  },

  // Reminders
  REMINDERS: {
    BASE: '/reminders',
    BY_ID: (id) => `/reminders/${id}`,
    COMPLETE: (id) => `/reminders/${id}/complete`,
    UPCOMING: '/reminders/upcoming',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
  },

  // Roles
  ROLES: {
    BASE: '/roles',
    BY_ID: (id) => `/roles/${id}`,
  },

  // Gmail
  GMAIL: {
    LABELS: '/gmail/labels',
    SYNC_LABELS: '/gmail/sync-labels',
    SYNC_SETTINGS: '/gmail/sync-settings',
    SYNCING_LABELS: '/gmail/syncing-labels',
    SYNC_EMAILS: '/gmail/sync-emails',
    SYNC_STATUS: '/gmail/sync-status',
  },

  // Emails
  EMAILS: {
    BASE: '/emails',
    BY_ID: (id) => `/emails/${id}`,
    THREAD: (threadId) => `/emails/thread/${threadId}`,
    LINK: (id) => `/emails/${id}/link`,
    UNLINKED: '/emails/unlinked',
    BY_ACCOUNT: (accountId) => `/emails/account/${accountId}`,
    TIMELINE: (accountId) => `/emails/account/${accountId}/timeline`,
    REPLY: (id) => `/emails/${id}/reply`,
  },

  // Lead Generation
  LEAD_GENERATION: {
    ANALYZE: '/lead-generation/analyze',
    PROFILES: '/lead-generation/profiles',
    PROFILE: (id) => `/lead-generation/profiles/${id}`,
    GENERATE: '/lead-generation/generate',
    IMPORT: '/lead-generation/import',
  },

  // Bulk Import
  BULK_IMPORT: {
    PROFILES: '/bulk-import/profiles',
    PROCESS: '/bulk-import/process',
  },

  // Email Campaigns
  EMAIL_CAMPAIGNS: {
    BASE: '/email-campaigns',
    BY_ID: (id) => `/email-campaigns/${id}`,
    ANALYTICS: '/email-campaigns/analytics',
    URGENT: '/email-campaigns/urgent',
    MARK_SENT: (id) => `/email-campaigns/${id}/mark-sent`,
    TOGGLE_COMMUNICATION: (id) => `/email-campaigns/${id}/toggle-communication`,
    BULK_MARK_SENT: '/email-campaigns/bulk/mark-sent',
  },
};

export default API_ENDPOINTS;
