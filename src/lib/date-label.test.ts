import { describe, expect, it } from 'vitest';
import { utcDateLabel } from '@/lib/date-label';

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

describe('utcDateLabel', () => {
  it('formats the day as written, with no time zone shift', () => {
    expect(utcDateLabel(FORMAT, '2005-05-25')).toBe('25 May 2005');
    expect(utcDateLabel(FORMAT, '2000-01-01')).toBe('1 Jan 2000');
  });
});
