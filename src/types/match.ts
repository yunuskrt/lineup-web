import type { z } from 'zod';
import type {
  competitionKindSchema,
  sideSchema,
} from '@/lib/api/schemas/common';
import type {
  clubRefSchema,
  competitionRefSchema,
  matchIdentitySchema,
  matchInPlaySchema,
} from '@/lib/api/schemas/match';

export type Side = z.infer<typeof sideSchema>;
export type CompetitionKind = z.infer<typeof competitionKindSchema>;
export type ClubRef = z.infer<typeof clubRefSchema>;
export type CompetitionRef = z.infer<typeof competitionRefSchema>;
export type MatchIdentity = z.infer<typeof matchIdentitySchema>;
export type MatchInPlay = z.infer<typeof matchInPlaySchema>;
