const { body, validationResult } = require('express-validator');

class Validators {
  /**
   * Get validation errors
   */
  static getValidationErrors(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));
    }
    return null;
  }

  /**
   * Email validation
   */
  static email() {
    return body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail();
  }

  /**
   * Password validation
   */
  static password(minLength = 8) {
    return body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: minLength }).withMessage(`Password must be at least ${minLength} characters`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  /**
   * Name validation
   */
  static name(fieldName = 'name') {
    return body(fieldName)
      .trim()
      .notEmpty().withMessage(`${fieldName} is required`)
      .isLength({ min: 2, max: 100 }).withMessage(`${fieldName} must be between 2 and 100 characters`);
  }

  /**
   * Optional name validation
   */
  static optionalName(fieldName = 'name') {
    return body(fieldName)
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage(`${fieldName} must be between 2 and 100 characters`);
  }

  /**
   * ID validation
   */
  static id(fieldName = 'id') {
    return body(fieldName)
      .notEmpty().withMessage(`${fieldName} is required`)
      .isInt({ min: 1 }).withMessage(`${fieldName} must be a positive integer`);
  }
}

module.exports = Validators;







