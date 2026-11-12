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

type ProLockButtonProps = {
  label: string;
  size?: ProLockSize;
  captionId?: string;
};

export function ProLockButton({
  label,
  size = 'default',
  captionId,
}: ProLockButtonProps) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-describedby={captionId}
      className={LOCKED_CONTROL[size]}
    >
      {label}
    </button>
  );
}

export function ProLockCaption({
  id,
  caption,
}: {
  id: string;
  caption: string;
}) {
  return (
    <p id={id} className="text-12 leading-4 text-fg-muted">
      {caption}{' '}
      <Link href={PRO_PATH} className={TEXT_LINK}>
        See Pro
      </Link>
    </p>
  );
}

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
      <ProLockButton
        label={label}
        size={size}
        captionId={isPending ? undefined : captionId}
      />
      {isPending ? null : <ProLockCaption id={captionId} caption={caption} />}
    </div>
  );
}
