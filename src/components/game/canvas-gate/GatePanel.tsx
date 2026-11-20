'use client';

import React, { type ReactNode, type RefObject } from 'react';
import { motion, useIsPresent } from 'motion/react';
import type { GateSize } from '@/components/game/CanvasGate';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { TYPE_TITLE_LONG } from '@/styles/classes';
import { MOTION_SECONDS } from '@/styles/motion';

const GATE_FADE = {
  duration: MOTION_SECONDS.gateFade,
  ease: 'easeOut',
} as const;

const INSTANT = { duration: 0 } as const;

const PANEL_SIZES: Record<GateSize, string> = {
  narrow: 'max-w-64 items-center text-center',
  wide: 'max-w-xl items-stretch text-left sm:p-6',
};

type Props = {
  panelRef: RefObject<HTMLDivElement | null>;
  icon?: ReactNode;
  title: string;
  detail?: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  size: GateSize;
};

const GatePanel = ({
  panelRef,
  icon,
  title,
  detail,
  body,
  action,
  size,
}: Props) => {
  // A fading-out panel must not take clicks or focus
  const isPresent = useIsPresent();
  const runs = useMotionPolicy();

  return (
    <motion.div
      inert={!isPresent}
      className="absolute inset-0 flex items-center justify-center rounded-lg bg-gate-scrim p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={runs('gateFade') ? GATE_FADE : INSTANT}
    >
      <div
        ref={panelRef}
        role="group"
        aria-label={title}
        tabIndex={-1}
        className={`flex w-full flex-col gap-2 rounded-lg border-2 border-line bg-surface-raised p-4 shadow-hard outline-none ${PANEL_SIZES[size]}`}
      >
        {icon}
        <p aria-hidden="true" className={`text-balance ${TYPE_TITLE_LONG}`}>
          {title}
        </p>
        {detail ? <p className="text-14 text-fg-muted">{detail}</p> : null}
        {body ? <div className="mt-2 self-stretch">{body}</div> : null}
        {action ? <div className="mt-2 self-stretch">{action}</div> : null}
      </div>
    </motion.div>
  );
};

export default GatePanel;
