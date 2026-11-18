import React from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { QUIT_CHIP } from '@/styles/classes';

type Props = {
  // Without a handler the chip just leaves
  onQuit?: () => void;
};

// The icon waits for sm: phones lack the room
const QuitChip = ({ onQuit }: Props) => {
  if (onQuit) {
    return (
      <button type="button" onClick={onQuit} className={QUIT_CHIP}>
        <X
          aria-hidden="true"
          strokeWidth={2.5}
          className="size-3.5 max-sm:hidden"
        />
        Quit
      </button>
    );
  }

  return (
    <Link href="/play" className={QUIT_CHIP}>
      <X
        aria-hidden="true"
        strokeWidth={2.5}
        className="size-3.5 max-sm:hidden"
      />
      Quit
    </Link>
  );
};

export default QuitChip;
