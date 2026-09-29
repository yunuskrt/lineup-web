import { SHIRT_PATH } from '@/components/game/shirt';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import type { Lives } from '@/types/game';

const PIPS = Array.from({ length: MAX_LIVES }, (_, index) => index);

export function livesLeftLabel(lives: Lives): string {
  return `${lives} of ${MAX_LIVES} lives left`;
}

// Static: a past game's lives never change
export function LivesLeft({ lives }: { lives: Lives }) {
  return (
    <span
      role="img"
      aria-label={livesLeftLabel(lives)}
      className="flex items-center gap-0.5"
    >
      {PIPS.map((index) => (
        <svg
          key={index}
          aria-hidden="true"
          viewBox="0 0 24 24"
          focusable="false"
          className="size-3.5"
        >
          <path
            d={SHIRT_PATH}
            className={index < lives ? 'fill-you' : 'fill-fg-dim'}
          />
        </svg>
      ))}
    </span>
  );
}
