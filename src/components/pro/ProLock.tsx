import Link from 'next/link';
import { useId } from 'react';
import { PRO_PATH } from '@/lib/pro';
import { FOCUS_RING, TEXT_LINK } from '@/styles/classes';

export type ProLockSize = 'default' | 'large';

// Never hovers: a locked control does nothing
const LOCKED_CONTROL: Record<ProLockSize, string> = {
  default: `rounded-sm border border-line px-4 py-2 text-14 font-semibold text-fg-muted ${FOCUS_RING}`,
  large: `rounded-sm border border-line px-8 py-2.75 text-16 font-semibold text-fg-muted ${FOCUS_RING}`,
};

type ProLockProps = {
  label: string;
  caption: string;
  size?: ProLockSize;
  // While the tier is unknown: no caption yet
  isPending?: boolean;
  isFullWidth?: boolean;
};

export function ProLock({
  label,
  caption,
  size = 'default',
  isPending = false,
  isFullWidth = false,
}: ProLockProps) {
  const captionId = useId();

  return (
    <div
      className={`flex flex-col gap-1.5 ${isFullWidth ? 'items-stretch' : 'items-start'}`}
    >
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={isPending ? undefined : captionId}
        className={LOCKED_CONTROL[size]}
      >
        {label}
      </button>
      {isPending ? null : (
        <p id={captionId} className="text-12 leading-4 text-fg-muted">
          {caption}{' '}
          <Link href={PRO_PATH} className={TEXT_LINK}>
            See Pro
          </Link>
        </p>
      )}
    </div>
  );
}
