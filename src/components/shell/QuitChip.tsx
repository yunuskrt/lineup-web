import Link from 'next/link';
import { QUIT_CHIP } from '@/styles/classes';

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
