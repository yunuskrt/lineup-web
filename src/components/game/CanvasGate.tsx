'use client';

import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react';
import { MOTION_DURATION_MS } from '@/styles/motion';

const GATE_FADE = {
  duration: MOTION_DURATION_MS.gateFade / 1000,
  ease: 'easeOut',
} as const;

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type GatePanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  title: string;
  detail?: string;
  action?: ReactNode;
};

function GatePanel({ panelRef, title, detail, action }: GatePanelProps) {
  // A fading-out panel must not take clicks or focus
  const isPresent = useIsPresent();

  return (
    <motion.div
      inert={!isPresent}
      className="absolute inset-0 flex items-center justify-center bg-gate-scrim p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={GATE_FADE}
    >
      <div
        ref={panelRef}
        role="group"
        aria-label={title}
        tabIndex={-1}
        className="flex w-full max-w-64 flex-col items-center gap-2 rounded-lg border border-line bg-surface-raised p-4 text-center outline-none"
      >
        <p aria-hidden="true" className="text-16 font-semibold text-fg">
          {title}
        </p>
        {detail ? <p className="text-14 text-fg-muted">{detail}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </motion.div>
  );
}

type CanvasGateProps = {
  isOpen: boolean;
  title: string;
  detail?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function CanvasGate({
  isOpen,
  title,
  detail,
  action,
  children,
}: CanvasGateProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Layout effect: read focus before inert blurs it
  useLayoutEffect(() => {
    const active = document.activeElement;
    const focused =
      active instanceof HTMLElement && active !== document.body ? active : null;
    const panel = panelRef.current;
    const isOpening = isOpen && !wasOpen.current;
    const isClosing = !isOpen && wasOpen.current;
    wasOpen.current = isOpen;

    if (isOpening) returnFocus.current = focused;

    if (isClosing) {
      const isStranded = focused === null || !!panel?.contains(focused);
      if (isStranded) returnFocus.current?.focus();
      returnFocus.current = null;
      return;
    }

    if (isOpen && (isOpening || focused === null)) {
      (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    }
  });

  return (
    <div className="relative size-full">
      <div inert={isOpen} className="size-full">
        {children}
      </div>
      <p role="status" className="sr-only">
        {isOpen ? title : ''}
      </p>
      <AnimatePresence>
        {isOpen ? (
          <GatePanel
            key="gate"
            panelRef={panelRef}
            title={title}
            detail={detail}
            action={action}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
