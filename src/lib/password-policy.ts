/**
 * Password validation rules.
 * Min 8 chars, max 200, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 */

// A slightly expanded list, but still limited. (See note below on how to really fix this)
const COMMON_PASSWORDS = new Set([
  '12345678', 'password', 'password1', 'qwerty12', 'abc12345',
  'iloveyou', '123456789', 'welcome1', 'admin123', '11111111',
  'letmein1', 'pa$$word', '1234567890'
]);

export type PasswordError =
  | 'password_too_short'
  | 'password_too_long'
  | 'password_no_uppercase'
  | 'password_no_lowercase'
  | 'password_no_number'
  | 'password_no_special'
  | 'password_too_common';

/**
 * Validates a password and returns an array of all failed criteria.
 * Returning an empty array means the password is valid.
 */
export function validatePassword(p: string): PasswordError[] {
  // Catch null/undefined/wrong types gracefully
  if (typeof p !== 'string' || !p) {
    return ['password_too_short'];
  }

  const errors: PasswordError[] = [];

  // 1. Length Checks
  if (p.length < 8) errors.push('password_too_short');
  if (p.length > 200) errors.push('password_too_long');

  // 2. Character Complexity Checks
  if (!/[A-Z]/.test(p)) errors.push('password_no_uppercase');
  if (!/[a-z]/.test(p)) errors.push('password_no_lowercase');
  if (!/[0-9]/.test(p)) errors.push('password_no_number');
  
  // Checks for anything that is NOT a letter or number (special characters)
  if (!/[^A-Za-z0-9]/.test(p)) errors.push('password_no_special');

  // 3. Common Dictionary Check (Case-insensitive)
  if (COMMON_PASSWORDS.has(p.toLowerCase())) {
    errors.push('password_too_common');
  }

  return errors;
}

export const PASSWORD_ERRORS: Record<PasswordError, string> = {
  password_too_short: 'Password must be at least 8 characters.',
  password_too_long: 'Password is too long (maximum is 200 characters).',
  password_no_uppercase: 'Password must include at least one uppercase letter.',
  password_no_lowercase: 'Password must include at least one lowercase letter.',
  password_no_number: 'Password must include at least one number.',
  password_no_special: 'Password must include at least one special character (e.g., !@#$%).',
  password_too_common: 'This password is too common or easily guessable. Please choose another.',
};