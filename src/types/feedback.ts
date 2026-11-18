export type GuessFeedback = {
  toast: string | null;
  clearInput: boolean;
  shakeInput: boolean;
  pulsePlayerId: string | null;
};

export type ToastMessage = { id: number; message: string };

export type GridPulse = { playerId: string; key: number };

export type ToastState = { toast: ToastMessage | null };

// The fields a guess's feedback writes, in solo and duel alike
export type FeedbackState = ToastState & {
  pulse?: GridPulse;
  shakeKey: number;
};
