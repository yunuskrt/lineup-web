import { describe, expect, it } from 'vitest';
import { formationSchema } from '@/lib/api/schemas/match';

describe('formationSchema', () => {
  it.each(['4-4-2', '3-5-2', '4-2-3-1', '4-1-2-1-2'])('accepts %s', (shape) => {
    expect(formationSchema.safeParse(shape).success).toBe(true);
  });

  it.each([
    ['an empty line', '0-4-6'],
    ['two lines', '4-6'],
    ['six lines', '1-1-2-2-2-2'],
    ['a two-digit line', '10-0-0'],
    ['spaces', '4 - 4 - 2'],
    ['empty', ''],
  ])('rejects %s, as the backend does', (_, shape) => {
    expect(formationSchema.safeParse(shape).success).toBe(false);
  });
});
