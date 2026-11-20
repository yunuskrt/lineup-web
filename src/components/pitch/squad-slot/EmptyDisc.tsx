import React from 'react';
import { HEADSHOT_SIZE } from '@/components/pitch/styles';
import { PERSON_PATH } from '@/components/pitch/person';

type Props = {};

const EmptyDisc = ({}: Props) => {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface-card ${HEADSHOT_SIZE}`}
    >
      <svg viewBox="0 0 24 24" focusable="false" className="size-3/5">
        <path d={PERSON_PATH} className="fill-fg-muted" />
      </svg>
    </span>
  );
};

export default EmptyDisc;
