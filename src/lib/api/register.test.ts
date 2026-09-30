import { afterEach, describe, expect, it, vi } from 'vitest';
import { scenarioFrom } from '@/lib/api/register';

describe('scenarioFrom', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads a known scenario from the query', () => {
    expect(scenarioFrom('?scenario=rateLimited')).toBe('rateLimited');
    expect(scenarioFrom('?state=idle&scenario=youDisconnect')).toBe(
      'youDisconnect',
    );
  });

  it('ignores an unknown or missing name', () => {
    expect(scenarioFrom('?scenario=nope')).toBeUndefined();
    expect(scenarioFrom('')).toBeUndefined();
  });

  it('ignores the query in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(scenarioFrom('?scenario=rateLimited')).toBeUndefined();
  });
});
