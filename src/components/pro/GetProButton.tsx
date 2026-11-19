import React, { useId } from 'react';
import { PRIMARY_BUTTON_LARGE } from '@/styles/classes';

type Props = {};

// The one place checkout plugs in, with payments
const GetProButton = ({}: Props) => {
  const noteId = useId();

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled
        aria-describedby={noteId}
        className={PRIMARY_BUTTON_LARGE}
      >
        Get Pro
      </button>
      <p id={noteId} className="text-14 leading-5 text-fg-muted">
        Pro isn&apos;t on sale yet.
      </p>
    </div>
  );
};

export default GetProButton;
