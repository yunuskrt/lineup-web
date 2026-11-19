import React from 'react';
import { Check, Minus } from 'lucide-react';

type Props = { value: string | null; isPro: boolean };

// Marks beside the words; the words carry the meaning
const Value = ({ value, isPro }: Props) => {
  if (value === null) {
    return (
      <>
        <Minus aria-hidden="true" className="size-4" strokeWidth={2.5} />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return (
    <span className="flex items-start gap-1.5">
      {isPro ? (
        <Check
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={3}
        />
      ) : null}
      <span>{value}</span>
    </span>
  );
};

export default Value;
