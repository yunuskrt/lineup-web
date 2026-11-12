import { describe, expect, it } from 'vitest';
import {
  soloMatchOfferSchema,
  soloStartRequestSchema,
  soloSummarySchema,
} from '@/lib/api/schemas/solo';
import { SAMPLE_IDENTITY, SAMPLE_OPEN_FILTERS } from '@/lib/dev/samples';

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

describe('soloSummarySchema', () => {
  const PLAYER = {
    id: 'player-1',
    name: 'Petr Čech',
    slot: 0,
    position: 'GK',
    imageUrl: null,
    directoryKey: 'player-1'.padEnd(22, 'x'),
  };
  const SUMMARY = {
    match: SAMPLE_IDENTITY,
    found: [{ ...PLAYER, order: 1, elapsedMs: 2_100 }],
    missedCount: 10,
    missed: null,
    livesRemaining: 0,
    endReason: 'lives_out',
    accuracy: 0.5,
    bestStreak: 1,
    roundTimesMs: [2_100],
  };

  it('accepts named players with their order and time', () => {
    expect(soloSummarySchema.safeParse(SUMMARY).success).toBe(true);
  });

  // Backend R4b always sends them
  it('rejects a summary whose players lack an order', () => {
    const old = { ...SUMMARY, found: [PLAYER] };
    expect(soloSummarySchema.safeParse(old).success).toBe(false);
  });
});

describe('soloStartRequestSchema', () => {
  it('takes the filters alone, as before R13', () => {
    expect(soloStartRequestSchema.safeParse(SAMPLE_OPEN_FILTERS).success).toBe(
      true,
    );
  });

  it('takes a match id beside the filters', () => {
    const picked = { ...SAMPLE_OPEN_FILTERS, matchId: SAMPLE_IDENTITY.id };
    expect(soloStartRequestSchema.parse(picked).matchId).toBe(
      SAMPLE_IDENTITY.id,
    );
  });

  it('still needs the filters with a match id', () => {
    expect(
      soloStartRequestSchema.safeParse({ matchId: SAMPLE_IDENTITY.id }).success,
    ).toBe(false);
  });
});
