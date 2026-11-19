import React from 'react';
import type { ProLockSize } from '@/components/pro/ProLock';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/classes';

// Never hovers or presses: it does nothing
function lockedControl(size: ProLockSize): string {
  return cn(
    buttonVariants({ variant: 'secondary', size }),
    'cursor-not-allowed text-fg-muted shadow-none hover:bg-surface-card',
  );
}

type Props = {
  label: string;
  size?: ProLockSize;
  captionId?: string;
};

const ProLockButton = ({ label, size = 'default', captionId }: Props) => {
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
};

export default ProLockButton;
