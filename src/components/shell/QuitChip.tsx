import Link from 'next/link';
import { FOCUS_RING } from '@/styles/classes';

export function QuitChip() {
  return (
    <Link
      href="/play"
      className={`rounded-sm border border-line px-3 py-1 text-12 font-medium uppercase text-fg-muted hover:text-fg ${FOCUS_RING}`}
    >
      Quit
    </Link>
  );
}
