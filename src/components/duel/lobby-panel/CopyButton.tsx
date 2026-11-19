'use client';

import React from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { SECONDARY_BUTTON } from '@/styles/classes';

type Props = {
  label: string;
  isCopied: boolean;
  icon: LucideIcon;
  onCopy: () => void;
};

const CopyButton = ({ label, isCopied, icon: Icon, onCopy }: Props) => {
  const Shown = isCopied ? Check : Icon;
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap ${SECONDARY_BUTTON}`}
      onClick={onCopy}
    >
      <Shown aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />
      {isCopied ? 'Copied' : label}
    </button>
  );
};

export default CopyButton;
