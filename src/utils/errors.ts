/**
 * Maps raw backend/network error messages or codes to user-friendly messages.
 */
export const getFriendlyErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message =
    typeof error === 'string'
      ? error
      : (error as { message?: string }).message || '';

  const lower = message.toLowerCase();

  // Supabase Auth specific error mapping
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please verify and try again.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please slow down and wait a moment.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (lower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('jwt expired') || lower.includes('session expired') || lower.includes('token expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  // Network errors
  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('offline')
  ) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Database / Storage constraints
  if (lower.includes('row-level security') || lower.includes('policy')) {
    return 'Permission denied. You can only view and modify your own records.';
  }
  if (lower.includes('bucket not found')) {
    return 'Storage bucket not configured. Please ensure schema.sql has been executed in Supabase.';
  }

  return message || 'An unexpected error occurred. Please try again.';
};
