import { useId } from 'react';
import { PRIMARY_BUTTON_LARGE } from '@/styles/classes';

// The one place checkout plugs in, with payments
export function GetProButton() {
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
        Checkout comes with payments.
      </p>
    </div>
  );
}
