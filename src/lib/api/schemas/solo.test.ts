import { describe, expect, it } from 'vitest';
import { soloMatchOfferSchema } from '@/lib/api/schemas/solo';
import { SAMPLE_IDENTITY } from '@/lib/dev/samples';

const OFFER = {
  sessionId: 'session-1',
  match: SAMPLE_IDENTITY,
  home: SAMPLE_IDENTITY.home,
  away: SAMPLE_IDENTITY.away,
};

describe('soloMatchOfferSchema', () => {
  it('accepts an offer with its match', () => {
    expect(soloMatchOfferSchema.safeParse(OFFER).success).toBe(true);
  });

  // Backend R4a always sends it
  it('rejects an offer without a match', () => {
    const withoutMatch = { ...OFFER, match: undefined };
    expect(soloMatchOfferSchema.safeParse(withoutMatch).success).toBe(false);
  });
});
