import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import { Badge } from '@/components/ui/badge';
import { PRO_PATH } from '@/lib/pro';
import { cn } from '@/lib/utils';
import { buttonVariants, TEXT_LINK } from '@/styles/classes';

export type ProLockSize = 'default' | 'large';

// Never hovers or presses: it does nothing
function lockedControl(size: ProLockSize): string {
  return cn(
    buttonVariants({ variant: 'secondary', size }),
    'cursor-not-allowed text-fg-muted shadow-none hover:bg-surface-card',
  );
}

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
      className={lockedControl(size)}
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
    <p id={id} className="text-12 leading-5 text-fg-muted">
      <Badge tone="brand" aria-hidden="true" className="mr-1.5 align-middle">
        <Lock />
        Pro
      </Badge>
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
