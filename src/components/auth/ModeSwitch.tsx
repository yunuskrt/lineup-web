import React from 'react';
import Link from 'next/link';
import { FOCUS_RING } from '@/styles/classes';
import type { AuthMode } from '@/types/auth';

type Props = {
  mode: AuthMode;
};

const MODES: { mode: AuthMode; label: string; href: string }[] = [
  { mode: 'sign-in', label: 'Sign in', href: '/sign-in' },
  { mode: 'sign-up', label: 'Create account', href: '/sign-in?mode=sign-up' },
];

const ModeSwitch = ({ mode }: Props) => {
  return (
    <nav
      aria-label="Account"
      className="flex gap-1 rounded-md border-2 border-line bg-surface-card p-1"
    >
      {MODES.map((item) => {
        const isActive = item.mode === mode;
        return (
          <Link
            key={item.mode}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-auto rounded-sm px-3 py-2 text-center text-14 leading-5 font-semibold whitespace-nowrap ${
              isActive
                ? 'bg-brand text-on-accent'
                : 'text-fg-muted hover:bg-surface hover:text-fg'
            } ${FOCUS_RING}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default ModeSwitch;
