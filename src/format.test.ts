import { describe, expect, it } from 'vitest';
import { shortId, timeAgo } from './format';

describe('format', () => {
  const now = new Date('2026-10-26T12:00:00Z').getTime();

  it('formats relative times', () => {
    expect(timeAgo('2026-10-26T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-10-26T11:55:00Z', now)).toBe('5 minutes ago');
    expect(timeAgo('2026-10-26T09:00:00Z', now)).toBe('3 hours ago');
    expect(timeAgo('2026-10-25T12:00:00Z', now)).toBe('yesterday');
  });

  it('shortens ids', () => {
    expect(shortId('11111111-2222-3333-4444-555555555555')).toBe('#11111111');
  });
});
