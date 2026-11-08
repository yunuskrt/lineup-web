import type { z } from 'zod';
import type {
  coinFlipResultSchema,
  coinFlipSourceSchema,
  connectionStateSchema,
  connectionStatusSchema,
  duelActorSchema,
  duelFoundPlayerSchema,
  duelGuessRequestSchema,
  duelNamedPlayerSchema,
  duelLifeLostSchema,
  duelPhaseSchema,
  duelPlayerSchema,
  duelResultSchema,
  duelSessionSchema,
  filterSubmissionSchema,
  filterSubmissionStatusSchema,
  pairedStateSchema,
  queueStateSchema,
  queueTimeoutSchema,
  roomExpirySchema,
  roomJoinRequestSchema,
  roomStateSchema,
} from '@/lib/api/schemas/duel';

export type DuelActor = z.infer<typeof duelActorSchema>;
export type DuelPhase = z.infer<typeof duelPhaseSchema>;
export type DuelPlayer = z.infer<typeof duelPlayerSchema>;
export type QueueState = z.infer<typeof queueStateSchema>;
export type QueueTimeout = z.infer<typeof queueTimeoutSchema>;
export type PairedState = z.infer<typeof pairedStateSchema>;
export type FilterSubmissionStatus = z.infer<
  typeof filterSubmissionStatusSchema
>;
export type FilterSubmission = z.infer<typeof filterSubmissionSchema>;
export type CoinFlipSource = z.infer<typeof coinFlipSourceSchema>;
export type CoinFlipResult = z.infer<typeof coinFlipResultSchema>;
export type RoomState = z.infer<typeof roomStateSchema>;
export type RoomExpiry = z.infer<typeof roomExpirySchema>;
export type RoomJoinRequest = z.infer<typeof roomJoinRequestSchema>;
export type DuelFoundPlayer = z.infer<typeof duelFoundPlayerSchema>;
export type DuelNamedPlayer = z.infer<typeof duelNamedPlayerSchema>;
export type DuelSession = z.infer<typeof duelSessionSchema>;
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;
export type ConnectionState = z.infer<typeof connectionStateSchema>;
export type DuelLifeLost = z.infer<typeof duelLifeLostSchema>;
export type DuelResult = z.infer<typeof duelResultSchema>;
export type DuelGuessRequest = z.infer<typeof duelGuessRequestSchema>;
