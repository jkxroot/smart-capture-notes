export function isAuthSessionError(error: unknown): boolean {
  if (!error) return false;
  const message =
    typeof error === 'string'
      ? error
      : (error as { message?: string }).message || '';
  const lower = message.toLowerCase();
  return (
    lower.includes('jwt expired') ||
    lower.includes('token expired') ||
    lower.includes('session expired') ||
    lower.includes('invalid refresh token') ||
    lower.includes('auth session missing') ||
    lower.includes('pgrst301') ||
    lower.includes('401') ||
    lower.includes('unauthorized')
  );
}

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  const message =
    typeof error === 'string'
      ? error
      : (error as { message?: string; name?: string }).message || '';
  const name = (error as { name?: string }).name || '';
  const lower = (message + ' ' + name).toLowerCase();
  return lower.includes('abort') || lower.includes('cancel');
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  if (__DEV__) {
    console.warn('[App Error Log]:', error);
  }

  if (isAbortError(error)) {
    return '';
  }

  const message =
    typeof error === 'string'
      ? error
      : (error as { message?: string }).message || '';
  const lower = message.toLowerCase();

  // Network issues
  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('offline') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('econnrefused')
  ) {
    return 'Unable to connect. Please check your internet connection.';
  }

  // Session / Auth expiration
  if (isAuthSessionError(error)) {
    return 'Session expired. Please sign in again.';
  }

  // Authentication errors
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  // Permission and RLS
  if (
    lower.includes('row-level security') ||
    lower.includes('policy') ||
    lower.includes('permission denied') ||
    lower.includes('403') ||
    lower.includes('forbidden')
  ) {
    return 'You do not have permission to perform this action.';
  }

  // Storage
  if (lower.includes('bucket not found')) {
    return 'Storage configuration error.';
  }
  if (lower.includes('object not found') || lower.includes('not found')) {
    return 'The requested item was not found.';
  }
  if (lower.includes('file size') || lower.includes('too large') || lower.includes('payload')) {
    return 'File size is too large.';
  }
  if (lower.includes('upload failed') || lower.includes('storage')) {
    return 'Unable to upload image. Please try again.';
  }

  // Validation
  if (lower.includes('check constraint') || lower.includes('char_length')) {
    return 'Input exceeds maximum allowed length.';
  }

  return 'Something went wrong. Please try again.';
}
