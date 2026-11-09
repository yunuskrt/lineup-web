export type ShowcasePlayback = {
  startsPaused?: boolean;
  // Dev snapshots: one moment of the loop
  frozenAtMs?: number;
  // Dev: the reduced-motion frame, forced
  isStill?: boolean;
};
