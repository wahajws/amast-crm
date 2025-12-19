/**
 * API Helper Utilities
 * Provides consistent functions for API calls and response handling
 */

/**
 * Build query string from object
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
}

/**
 * Extract pagination data from API response
 */
export function extractPaginationData(response) {
  const data = response?.data?.data || {};
  return {
    data: data.data || [],
    pagination: {
      page: data.pagination?.page || 1,
      pageSize: data.pagination?.pageSize || 10,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 1,
    }
  };
}

/**
 * Extract single item from API response
 */
export function extractItemData(response) {
  return response?.data?.data || null;
}

/**
 * Handle API error consistently
 */
export function handleApiError(error, defaultMessage = 'An error occurred') {
  const message = error?.response?.data?.message || 
                 error?.message || 
                 defaultMessage;
  return message;
}

/**
 * Create pagination state
 */
export function createPaginationState(initialPage = 1, initialPageSize = 10) {
  return {
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 1,
  };
}

/**
 * Update pagination state from API response
 */
export function updatePaginationFromResponse(pagination, response) {
  const paginationData = extractPaginationData(response);
  return {
    ...pagination,
    total: paginationData.pagination.total,
    totalPages: paginationData.pagination.totalPages,
  };
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data, requiredFields) {
  const errors = {};
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors[field] = `${field} is required`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date) {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Try to parse and format
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return null;
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return 'N/A';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numAmount);
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status, statusMap = {}) {
  const defaultMap = {
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-gray',
    PENDING: 'badge-warning',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-gray',
    WON: 'badge-success',
    LOST: 'badge-danger',
    DRAFT: 'badge-gray',
    SENT: 'badge-blue',
    REVIEWED: 'badge-yellow',
    APPROVED: 'badge-green',
    REJECTED: 'badge-red',
    ACCEPTED: 'badge-success',
  };
  
  const mergedMap = { ...defaultMap, ...statusMap };
  return mergedMap[status] || 'badge-gray';
}







