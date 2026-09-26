import type { DuelActor } from '@/types/duel';

export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export const SITE_CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

export const DUEL_ACTOR_BG: Record<DuelActor, string> = {
  you: 'bg-you',
  opponent: 'bg-opponent',
};

export const PRIMARY_BUTTON = `rounded-sm bg-brand px-4 py-1.5 text-14 font-semibold text-on-accent ${FOCUS_RING}`;

export const DEV_PREVIEW_BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised disabled:text-fg-dim disabled:hover:bg-transparent aria-pressed:bg-surface-card ${FOCUS_RING}`;

// Literal for Tailwind; checked against motion.ts
export const LIFE_LOST_FILL_SHIFT =
  'transition-[fill] duration-480 ease-[ease]';

export const TURN_BORDER_SHIFT =
  'transition-[border-color] duration-240 ease-[ease-out]';

export const TIMER_COLOR_SHIFT =
  'transition-[stroke,color] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]';
