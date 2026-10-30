import {
  validateEmail,
  validatePassword,
  validateRecordTitle,
  validateRecordNotes,
} from '../validation';

describe('validation', () => {
  it('rejects invalid emails', () => {
    expect(validateEmail('bad').isValid).toBe(false);
    expect(validateEmail('ok@example.com').isValid).toBe(true);
  });

  it('enforces password length', () => {
    expect(validatePassword('123').isValid).toBe(false);
    expect(validatePassword('123456').isValid).toBe(true);
  });

  it('requires title and caps notes length', () => {
    expect(validateRecordTitle('  ').isValid).toBe(false);
    expect(validateRecordTitle('Hello').isValid).toBe(true);
    expect(validateRecordNotes('x'.repeat(2001)).isValid).toBe(false);
    expect(validateRecordNotes('ok').isValid).toBe(true);
  });
});
