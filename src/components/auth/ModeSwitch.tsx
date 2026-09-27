import Link from 'next/link';
import { FOCUS_RING } from '@/styles/classes';
import type { AuthMode } from '@/types/auth';

type ModeSwitchProps = {
  mode: AuthMode;
};

const MODES: { mode: AuthMode; label: string; href: string }[] = [
  { mode: 'sign-in', label: 'Sign in', href: '/sign-in' },
  { mode: 'sign-up', label: 'Create account', href: '/sign-in?mode=sign-up' },
];

export function ModeSwitch({ mode }: ModeSwitchProps) {
  return (
    <nav aria-label="Account" className="flex gap-6 border-b border-line">
      {MODES.map((item) => {
        const isActive = item.mode === mode;
        return (
          <Link
            key={item.mode}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px rounded-t-sm border-b-2 pb-3 text-14 font-semibold ${
              isActive
                ? 'border-brand text-fg'
                : 'border-transparent text-fg-muted hover:text-fg'
            } ${FOCUS_RING}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
