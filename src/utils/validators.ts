/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (supports international formats)
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Check for valid phone number patterns:
  // - Starts with + followed by 10-15 digits (international)
  // - Or 10-15 digits without + (local)
  const internationalRegex = /^\+\d{10,15}$/;
  const localRegex = /^\d{10,15}$/;

  return internationalRegex.test(cleaned) || localRegex.test(cleaned);
};

/**
 * Get phone validation error message
 */
export const getPhoneValidationError = (phoneNumber: string): string | null => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return 'Phone number is required';
  }

  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  if (cleaned.length < 10) {
    return 'Phone number must be at least 10 digits';
  }

  if (cleaned.length > 15) {
    return 'Phone number is too long';
  }

  if (!validatePhoneNumber(phoneNumber)) {
    return 'Please enter a valid phone number';
  }

  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get password strength level
 */
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

/**
 * Validate name (letters, spaces, hyphens only)
 */
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name) && name.trim().length >= 2;
};

/**
 * Validate username (alphanumeric, underscore, dot)
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate URL
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if string is empty or only whitespace
 */
export const isEmpty = (value: string): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};
