import type { DuelActor } from '@/types/duel';

export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export const SITE_CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

export const DUEL_ACTOR_BG: Record<DuelActor, string> = {
  you: 'bg-you',
  opponent: 'bg-opponent',
};

export const DUEL_ACTOR_TEXT: Record<DuelActor, string> = {
  you: 'text-you',
  opponent: 'text-opponent',
};

export const DUEL_ACTOR_BORDER: Record<DuelActor, string> = {
  you: 'border-you',
  opponent: 'border-opponent',
};

export const PRIMARY_BUTTON = `rounded-sm bg-brand px-4 py-1.5 text-14 font-semibold text-on-accent ${FOCUS_RING}`;

export const PRIMARY_BUTTON_LARGE = `rounded-sm bg-brand px-8 py-3 text-16 font-semibold text-on-accent disabled:opacity-70 ${FOCUS_RING}`;

export const SECONDARY_BUTTON = `rounded-sm border border-line px-4 py-2 text-14 font-semibold text-fg hover:bg-surface-raised disabled:text-fg-muted disabled:hover:bg-transparent ${FOCUS_RING}`;

export const CHOICE_BUTTON = `rounded-sm border border-line bg-surface-card px-4 py-2 text-14 font-semibold text-fg hover:border-brand ${FOCUS_RING}`;

export const TEXT_INPUT = `w-full rounded-sm border border-line bg-surface-card px-3 py-2.5 text-16 text-fg aria-invalid:border-danger read-only:text-fg-muted ${FOCUS_RING}`;

export const TEXT_LINK = `rounded-sm font-medium text-fg underline decoration-line underline-offset-4 hover:decoration-fg ${FOCUS_RING}`;

export const QUIT_CHIP = `rounded-sm border border-line px-3 py-1 text-12 font-medium uppercase text-fg-muted hover:text-fg ${FOCUS_RING}`;

export const FILTER_CHIP = `rounded-sm border border-line px-3 py-1.5 text-14 font-medium text-fg-muted hover:text-fg aria-pressed:border-fg aria-pressed:bg-surface-card aria-pressed:text-fg ${FOCUS_RING}`;

export const FILTER_SELECT = `rounded-sm border border-line bg-surface-card px-3 py-2 text-14 text-fg ${FOCUS_RING}`;

// 24px hit area around a small dot (WCAG 2.5.8)
export const DOT_BUTTON = `flex size-6 items-center justify-center rounded-sm disabled:cursor-not-allowed ${FOCUS_RING}`;

export const DEV_PREVIEW_BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised disabled:text-fg-dim disabled:hover:bg-transparent aria-pressed:bg-surface-card ${FOCUS_RING}`;

// Literal for Tailwind; checked against motion.ts
export const LIFE_LOST_FILL_SHIFT =
  'transition-[fill] duration-480 ease-[ease]';

export const LIFE_LOST_BORDER_SHIFT =
  'transition-[border-color] duration-480 ease-[ease]';

export const TIMER_COLOR_SHIFT =
  'transition-[stroke,color] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]';
