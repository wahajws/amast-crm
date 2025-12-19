const BaseModel = require('../base/BaseModel');

class User extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.email = data.email || null;
    this.passwordHash = data.password_hash || data.passwordHash || null;
    this.firstName = data.first_name || data.firstName || null;
    this.lastName = data.last_name || data.lastName || null;
    this.profilePicture = data.profile_picture || data.profilePicture || null;
    this.roleId = data.role_id || data.roleId || null;
    this.status = data.status || 'ACTIVE';
    this.gmailAccessToken = data.gmail_access_token || data.gmailAccessToken || null;
    this.gmailRefreshToken = data.gmail_refresh_token || data.gmailRefreshToken || null;
    this.gmailTokenExpiry = data.gmail_token_expiry || data.gmailTokenExpiry || null;
    this.lastLogin = data.last_login || data.lastLogin || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.updatedBy = data.updated_by || data.updatedBy || null;
    this.role = data.role || null;
    // New fields for registration and approval
    this.registrationToken = data.registration_token || data.registrationToken || null;
    this.registrationTokenExpiresAt = data.registration_token_expires_at || data.registrationTokenExpiresAt || null;
    this.emailVerifiedAt = data.email_verified_at || data.emailVerifiedAt || null;
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.failedLoginAttempts = data.failed_login_attempts || data.failedLoginAttempts || 0;
    this.lockedUntil = data.locked_until || data.lockedUntil || null;
    this.mustChangePassword = data.must_change_password || data.mustChangePassword || false;
  }

  static getTableName() {
    return 'users';
  }

  static getFillableFields() {
    return [
      'email',
      'password_hash',
      'first_name',
      'last_name',
      'profile_picture',
      'role_id',
      'status',
      'gmail_access_token',
      'gmail_refresh_token',
      'gmail_token_expiry',
      'last_login',
      'created_by',
      'updated_by',
      'registration_token',
      'registration_token_expires_at',
      'email_verified_at',
      'approved_at',
      'approved_by',
      'failed_login_attempts',
      'locked_until',
      'must_change_password'
    ];
  }

  static getHiddenFields() {
    return ['password_hash', 'gmail_access_token', 'gmail_refresh_token'];
  }

  validate() {
    const errors = [];

    if (!this.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }

    if (!this.roleId) {
      errors.push('Role is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    const obj = super.toJSON();
    // Remove sensitive fields
    delete obj.passwordHash;
    delete obj.gmailAccessToken;
    delete obj.gmailRefreshToken;
    return obj;
  }
}

module.exports = User;

