import Link from 'next/link';
import { PRO_PATH } from '@/lib/pro';
import { SECONDARY_BUTTON, TEXT_LINK } from '@/styles/classes';

type SoloAllowanceNoteProps = {
  id: string;
  // The server's count, as allowanceLine words it
  line: string;
  isCapped: boolean;
  onPlayDuel: () => void;
};

// At 0 it never dead-ends: a duel, or Pro
export function SoloAllowanceNote({
  id,
  line,
  isCapped,
  onPlayDuel,
}: SoloAllowanceNoteProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p id={id} className="text-14 text-pretty text-fg-muted">
        {line}
      </p>
      {isCapped ? (
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onPlayDuel}
            className={SECONDARY_BUTTON}
          >
            Play a duel
          </button>
          <Link href={PRO_PATH} className={`text-14 ${TEXT_LINK}`}>
            See Pro
          </Link>
        </div>
      ) : null}
    </div>
  );
}
