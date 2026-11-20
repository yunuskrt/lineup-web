'use client';

import React, { type ReactNode, useLayoutEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import GatePanel from '@/components/game/canvas-gate/GatePanel';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export type GateSize = 'narrow' | 'wide';

type Props = {
  isOpen: boolean;
  // Decorative, above the title
  icon?: ReactNode;
  title: string;
  // May tick; the title is what gets announced
  detail?: ReactNode;
  // Content beyond one action, under the detail
  body?: ReactNode;
  action?: ReactNode;
  size?: GateSize;
  children: ReactNode;
};

const CanvasGate = ({
  isOpen,
  icon,
  title,
  detail,
  body,
  action,
  size = 'narrow',
  children,
}: Props) => {
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
            icon={icon}
            title={title}
            detail={detail}
            body={body}
            action={action}
            size={size}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CanvasGate;
