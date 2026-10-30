import { getFriendlyErrorMessage, isAuthSessionError, isAbortError } from '../errors';

describe('errors', () => {
  it('detects auth session errors', () => {
    expect(isAuthSessionError('JWT expired')).toBe(true);
    expect(isAuthSessionError('network timeout')).toBe(false);
  });

  it('detects abort errors', () => {
    expect(isAbortError({ name: 'AbortError', message: 'aborted' })).toBe(true);
  });

  it('maps common auth and network messages', () => {
    expect(getFriendlyErrorMessage('Invalid login credentials')).toContain('Incorrect');
    expect(getFriendlyErrorMessage('Network request failed')).toContain('internet');
  });
});
