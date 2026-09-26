import { afterEach, describe, expect, it, vi } from 'vitest';
import { devOnlyParam } from '@/lib/dev/route';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('devOnlyParam', () => {
  it('passes the value through outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(devOnlyParam('idle')).toBe('idle');
    expect(devOnlyParam(['idle', 'warning'])).toEqual(['idle', 'warning']);
  });

  it('drops the value in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(devOnlyParam('idle')).toBeUndefined();
    expect(devOnlyParam(['idle'])).toBeUndefined();
  });
});
