/**
 * API Service
 * Centralized service for making API calls with consistent error handling
 */

import { api } from './api';
import API_ENDPOINTS from '../config/apiEndpoints';
import { 
  buildQueryString, 
  extractPaginationData, 
  extractItemData, 
  handleApiError 
} from '../utils/apiHelpers';

/**
 * Generic GET request with pagination support
 */
export async function fetchList(endpoint, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const response = await api.get(url);
    return extractPaginationData(response);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch data'));
  }
}

/**
 * Generic GET request for single item
 */
export async function fetchItem(endpoint) {
  try {
    const response = await api.get(endpoint);
    return extractItemData(response);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to fetch item'));
  }
}

/**
 * Generic POST request
 */
export async function createItem(endpoint, data) {
  try {
    const response = await api.post(endpoint, data);
    return extractItemData(response);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to create item'));
  }
}

/**
 * Generic PUT request
 */
export async function updateItem(endpoint, data) {
  try {
    const response = await api.put(endpoint, data);
    return extractItemData(response);
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to update item'));
  }
}

/**
 * Generic DELETE request
 */
export async function deleteItem(endpoint) {
  try {
    await api.delete(endpoint);
    return true;
  } catch (error) {
    throw new Error(handleApiError(error, 'Failed to delete item'));
  }
}

// Account Service
export const accountService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.ACCOUNTS.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.ACCOUNTS.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.ACCOUNTS.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.ACCOUNTS.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.ACCOUNTS.BY_ID(id)),
  getEmails: (id) => fetchItem(API_ENDPOINTS.ACCOUNTS.EMAILS(id)),
  getWithEmailCounts: () => fetchItem(API_ENDPOINTS.ACCOUNTS.WITH_EMAIL_COUNTS),
};

// Contact Service
export const contactService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.CONTACTS.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.CONTACTS.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.CONTACTS.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.CONTACTS.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.CONTACTS.BY_ID(id)),
  getEmails: (id) => fetchItem(API_ENDPOINTS.CONTACTS.EMAILS(id)),
};

// Opportunity Service
export const opportunityService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.OPPORTUNITIES.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.OPPORTUNITIES.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id)),
};

// Proposal Service
export const proposalService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.PROPOSALS.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.PROPOSALS.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.PROPOSALS.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.PROPOSALS.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.PROPOSALS.BY_ID(id)),
};

// Note Service
export const noteService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.NOTES.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.NOTES.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.NOTES.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.NOTES.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.NOTES.BY_ID(id)),
  markReminderComplete: async (id) => {
    try {
      const response = await api.patch(API_ENDPOINTS.NOTES.REMINDER_COMPLETE(id));
      return extractItemData(response);
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to mark reminder as complete'));
    }
  },
};

// Reminder Service
export const reminderService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.REMINDERS.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.REMINDERS.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.REMINDERS.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.REMINDERS.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.REMINDERS.BY_ID(id)),
  markComplete: async (id) => {
    try {
      const response = await api.patch(API_ENDPOINTS.REMINDERS.COMPLETE(id));
      return extractItemData(response);
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to mark reminder as complete'));
    }
  },
  getUpcoming: (params) => fetchList(API_ENDPOINTS.REMINDERS.UPCOMING, params),
};

// User Service
export const userService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.USERS.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.USERS.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.USERS.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.USERS.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.USERS.BY_ID(id)),
};

// Role Service
export const roleService = {
  fetchAll: () => fetchList(API_ENDPOINTS.ROLES.BASE),
  fetchById: (id) => fetchItem(API_ENDPOINTS.ROLES.BY_ID(id)),
  create: (data) => createItem(API_ENDPOINTS.ROLES.BASE, data),
  update: (id, data) => updateItem(API_ENDPOINTS.ROLES.BY_ID(id), data),
  delete: (id) => deleteItem(API_ENDPOINTS.ROLES.BY_ID(id)),
};

// Gmail Service
export const gmailService = {
  getLabels: () => fetchItem(API_ENDPOINTS.GMAIL.LABELS),
  syncLabels: () => createItem(API_ENDPOINTS.GMAIL.SYNC_LABELS, {}),
  updateSyncSettings: (data) => updateItem(API_ENDPOINTS.GMAIL.SYNC_SETTINGS, data),
  getSyncingLabels: () => fetchItem(API_ENDPOINTS.GMAIL.SYNCING_LABELS),
  syncEmails: (data = {}) => createItem(API_ENDPOINTS.GMAIL.SYNC_EMAILS, data),
  getSyncStatus: () => fetchItem(API_ENDPOINTS.GMAIL.SYNC_STATUS),
};

// Email Service
export const emailService = {
  fetchAll: (params) => fetchList(API_ENDPOINTS.EMAILS.BASE, params),
  fetchById: (id) => fetchItem(API_ENDPOINTS.EMAILS.BY_ID(id)),
  getThread: (threadId) => fetchItem(API_ENDPOINTS.EMAILS.THREAD(threadId)),
  update: (id, data) => updateItem(API_ENDPOINTS.EMAILS.BY_ID(id), data),
  link: (id, data) => createItem(API_ENDPOINTS.EMAILS.LINK(id), data),
  getUnlinked: (params) => fetchList(API_ENDPOINTS.EMAILS.UNLINKED, params),
  delete: (id) => deleteItem(API_ENDPOINTS.EMAILS.BY_ID(id)),
  getByAccount: (accountId, params) => fetchList(API_ENDPOINTS.EMAILS.BY_ACCOUNT(accountId), params),
  getTimeline: (accountId) => fetchItem(API_ENDPOINTS.EMAILS.TIMELINE(accountId)),
  sendReply: async (id, data) => {
    try {
      const response = await api.post(API_ENDPOINTS.EMAILS.REPLY(id), data);
      return extractItemData(response);
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to send reply'));
    }
  },
};

