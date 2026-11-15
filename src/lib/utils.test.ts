import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  // Plain tailwind-merge drops one of these
  it('keeps a text size and a text colour together', () => {
    expect(cn('text-14 text-fg')).toBe('text-14 text-fg');
    expect(cn('text-72', 'text-on-accent')).toBe('text-72 text-on-accent');
  });

  it('lets a later size or colour win', () => {
    expect(cn('text-14', 'text-16')).toBe('text-16');
    expect(cn('text-fg', 'text-on-accent')).toBe('text-on-accent');
  });

  it('treats the hard shadows as one group', () => {
    expect(cn('shadow-hard', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-hard', 'shadow-hard-sm')).toBe('shadow-hard-sm');
  });

  it('merges role colours by property', () => {
    expect(cn('bg-brand', 'bg-surface-card')).toBe('bg-surface-card');
    expect(cn('border-2 border-line', 'border-rule')).toBe(
      'border-2 border-rule',
    );
  });

  it('drops falsy inputs', () => {
    expect(cn('rounded-md', false, null, undefined, '')).toBe('rounded-md');
  });
});
