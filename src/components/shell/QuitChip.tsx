import Link from 'next/link';
import { FOCUS_RING } from '@/styles/classes';

const QUIT_CHIP = `rounded-sm border border-line px-3 py-1 text-12 font-medium uppercase text-fg-muted hover:text-fg ${FOCUS_RING}`;

type QuitChipProps = {
  // Without a handler the chip just leaves
  onQuit?: () => void;
};

export function QuitChip({ onQuit }: QuitChipProps) {
  if (onQuit) {
    return (
      <button type="button" onClick={onQuit} className={QUIT_CHIP}>
        Quit
      </button>
    );
  }

  return (
    <Link href="/play" className={QUIT_CHIP}>
      Quit
    </Link>
  );
}
