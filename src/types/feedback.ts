export type GuessFeedback = {
  toast: string | null;
  clearInput: boolean;
  shakeInput: boolean;
  pulsePlayerId: string | null;
};

export type ToastMessage = { id: number; message: string };

export type GridPulse = { playerId: string; key: number };
