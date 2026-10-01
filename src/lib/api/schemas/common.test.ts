import { describe, expect, it } from 'vitest';
import { imageUrlSchema } from '@/lib/api/schemas/common';

describe('imageUrlSchema', () => {
  it.each([
    'https://cdn.lineup.gg/players/onur-isiklar.webp',
    'http://localhost:3001/crests/yld.svg',
    '/mock/crests/club-yildirimspor.svg',
    '/mock/players/headshot-1.svg',
  ])('accepts %s', (url) => {
    expect(imageUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    ['protocol-relative', '//evil.example/x.svg'],
    ['data URI', 'data:image/svg+xml;base64,PHN2Zy8+'],
    ['javascript', 'javascript:alert(1)'],
    ['other protocol', 'ftp://cdn.lineup.gg/x.png'],
    ['bare relative', 'mock/crests/x.svg'],
    ['dot relative', './mock/x.svg'],
    ['root only', '/'],
    ['with whitespace', '/mock/a b.svg'],
    ['empty', ''],
  ])('rejects a %s path', (_, url) => {
    expect(imageUrlSchema.safeParse(url).success).toBe(false);
  });
});
