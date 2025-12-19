/**
 * Password Validation Utility (Frontend)
 * Validates password strength and requirements
 */

class PasswordValidator {
  /**
   * Validate password strength
   */
  static validate(password) {
    const errors = [];

    if (!password) {
      return {
        isValid: false,
        errors: ['Password is required'],
        strength: 'weak'
      };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    let strength = 'weak';
    if (errors.length === 0) {
      if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        strength = 'strong';
      } else if (password.length >= 10) {
        strength = 'medium';
      } else {
        strength = 'weak';
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  /**
   * Get password strength indicator
   */
  static getStrengthIndicator(password) {
    if (!password) return { strength: 'none', percentage: 0, color: 'gray' };

    const validation = this.validate(password);
    
    if (!validation.isValid) {
      return { strength: 'weak', percentage: 25, color: 'red' };
    }

    switch (validation.strength) {
      case 'strong':
        return { strength: 'strong', percentage: 100, color: 'green' };
      case 'medium':
        return { strength: 'medium', percentage: 66, color: 'yellow' };
      default:
        return { strength: 'weak', percentage: 33, color: 'orange' };
    }
  }
}

export default PasswordValidator;







