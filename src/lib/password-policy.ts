/**
 * Password validation rules.
 * Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 *
 * Returns a single error code string, or null if password is valid.
 * (Keeps the contract simple: routes can check `if (err)`.)
 */

const COMMON_PASSWORDS = new Set([
  '12345678', 'password', 'password1', 'qwerty12', 'abc12345',
  'iloveyou', '123456789', 'welcome1', 'admin123', '11111111',
  'letmein1', 'pa$$word', '1234567890',
]);

export type PasswordError =
  | 'password_too_short'
  | 'password_too_long'
  | 'password_no_uppercase'
  | 'password_no_lowercase'
  | 'password_no_number'
  | 'password_no_special'
  | 'password_too_common';

export function validatePassword(p: string): PasswordError | null {
  if (typeof p !== 'string' || !p) return 'password_too_short';
  if (p.length < 8) return 'password_too_short';
  if (p.length > 200) return 'password_too_long';
  if (!/[A-Z]/.test(p)) return 'password_no_uppercase';
  if (!/[a-z]/.test(p)) return 'password_no_lowercase';
  if (!/[0-9]/.test(p)) return 'password_no_number';
  if (!/[^A-Za-z0-9]/.test(p)) return 'password_no_special';
  if (COMMON_PASSWORDS.has(p.toLowerCase())) return 'password_too_common';
  return null;
}

export const PASSWORD_ERRORS: Record<PasswordError, string> = {
  password_too_short: 'Password must be at least 8 characters.',
  password_too_long: 'Password is too long (maximum 200 characters).',
  password_no_uppercase: 'Password must include at least one uppercase letter.',
  password_no_lowercase: 'Password must include at least one lowercase letter.',
  password_no_number: 'Password must include at least one number.',
  password_no_special: 'Password must include at least one special character (e.g., !@#$%).',
  password_too_common: 'This password is too common. Please choose another.',
};
