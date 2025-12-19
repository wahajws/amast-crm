/**
 * Domain Matching Utility
 * Intelligently matches account names to email domains
 */

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string|null} - Domain or null
 */
function extractDomain(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const emailLower = email.toLowerCase().trim();
  const atIndex = emailLower.indexOf('@');
  
  if (atIndex === -1) {
    return null;
  }
  
  return emailLower.substring(atIndex + 1);
}

/**
 * Normalize account name for matching
 * Removes spaces, converts to lowercase, removes common suffixes
 * @param {string} accountName - Account name
 * @returns {string} - Normalized account name
 */
function normalizeAccountName(accountName) {
  if (!accountName || typeof accountName !== 'string') {
    return '';
  }
  
  // Convert to lowercase and remove spaces
  let normalized = accountName.toLowerCase().trim().replace(/\s+/g, '');
  
  // Remove common suffixes that might not be in domain
  const suffixes = ['solutions', 'systems', 'technologies', 'tech', 'inc', 'ltd', 'llc', 'corp', 'corporation', 'group', 'company'];
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length);
    }
  }
  
  return normalized;
}

/**
 * Normalize domain for matching
 * Removes www, common TLDs for comparison
 * @param {string} domain - Email domain
 * @returns {string} - Normalized domain
 */
function normalizeDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return '';
  }
  
  let normalized = domain.toLowerCase().trim();
  
  // Remove www.
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }
  
  // Extract base domain (remove TLD for fuzzy matching)
  // e.g., "amast.com.my" -> "amast"
  const parts = normalized.split('.');
  if (parts.length > 0) {
    normalized = parts[0];
  }
  
  return normalized;
}

/**
 * Check if email domain matches account name
 * Uses smart matching: compares normalized account name with domain base
 * @param {string} email - Email address
 * @param {string} accountName - Account name
 * @returns {boolean} - True if matches
 */
function matchesAccount(email, accountName) {
  const domain = extractDomain(email);
  if (!domain || !accountName) {
    return false;
  }
  
  const normalizedAccount = normalizeAccountName(accountName);
  const normalizedDomain = normalizeDomain(domain);
  
  // Exact match
  if (normalizedAccount === normalizedDomain) {
    return true;
  }
  
  // Check if account name is contained in domain or vice versa
  if (normalizedDomain.includes(normalizedAccount) || normalizedAccount.includes(normalizedDomain)) {
    return true;
  }
  
  // Check if domain starts with account name (e.g., "amast" matches "amast.com.my")
  const domainBase = domain.split('.')[0].toLowerCase();
  if (normalizedAccount === domainBase) {
    return true;
  }
  
  return false;
}

/**
 * Find matching account for an email
 * @param {string} email - Email address
 * @param {Array} accounts - Array of account objects with 'name' property
 * @returns {Object|null} - Matching account or null
 */
function findMatchingAccount(email, accounts) {
  if (!email || !Array.isArray(accounts)) {
    return null;
  }
  
  for (const account of accounts) {
    if (matchesAccount(email, account.name)) {
      return account;
    }
  }
  
  return null;
}

/**
 * Extract domain patterns from account name
 * Generates possible domain patterns for an account
 * @param {string} accountName - Account name
 * @returns {Array<string>} - Array of possible domain patterns
 */
function generateDomainPatterns(accountName) {
  if (!accountName || typeof accountName !== 'string') {
    return [];
  }
  
  const normalized = normalizeAccountName(accountName);
  const patterns = [normalized];
  
  // Add common TLD variations
  const tlds = ['com', 'com.my', 'net', 'org', 'co', 'io'];
  for (const tld of tlds) {
    patterns.push(`${normalized}.${tld}`);
  }
  
  return patterns;
}

module.exports = {
  extractDomain,
  normalizeAccountName,
  normalizeDomain,
  matchesAccount,
  findMatchingAccount,
  generateDomainPatterns
};





