export type ApiMode = 'mock' | 'real';

// Names a mode, never a secret: safe to ship
export const API_MODE: ApiMode =
  process.env.NEXT_PUBLIC_API_MODE === 'real' ? 'real' : 'mock';
