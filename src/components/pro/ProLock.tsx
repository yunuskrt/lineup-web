import React, { useId } from 'react';
import ProLockButton from '@/components/pro/ProLockButton';
import ProLockCaption from '@/components/pro/ProLockCaption';

export type ProLockSize = 'default' | 'large';

type Props = {
  label: string;
  caption: string;
  size?: ProLockSize;
  // While the tier is unknown: no caption yet
  isPending?: boolean;
  isFullWidth?: boolean;
};

const ProLock = ({
  label,
  caption,
  size = 'default',
  isPending = false,
  isFullWidth = false,
}: Props) => {
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
};

export default ProLock;
