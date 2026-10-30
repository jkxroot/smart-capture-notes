import { escapeIlikePattern } from '../escape';

describe('escapeIlikePattern', () => {
  it('escapes percent, underscore, and backslash', () => {
    expect(escapeIlikePattern('100%_off\\deal')).toBe('100\\%\\_off\\\\deal');
  });

  it('strips PostgREST filter separators', () => {
    expect(escapeIlikePattern('a,b(c)')).toBe('a b c');
  });

  it('returns empty for empty input', () => {
    expect(escapeIlikePattern('')).toBe('');
  });
});
