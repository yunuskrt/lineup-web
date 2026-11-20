'use client';

import React, { type ReactNode, useId } from 'react';
import { SECTION_LABEL } from '@/styles/classes';

type Props = {
  hint: string;
  chip?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

// A section of the rail pane, not a card of its own
const CardFrame = ({ hint, chip, footer, children }: Props) => {
  const labelId = useId();

  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-2">
      <div className="flex h-6 items-center justify-between gap-2">
        <span id={labelId} className={SECTION_LABEL}>
          Lives
        </span>
        {chip}
      </div>
      {children}
      {/* Hidden below lg to keep the band short */}
      <p className="hidden text-12 text-fg-muted lg:block">{hint}</p>
      {footer}
    </section>
  );
};

export default CardFrame;
