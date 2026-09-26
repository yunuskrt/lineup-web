'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { MOTION_DURATION_MS } from '@/styles/motion';

const VISIBLE_SECONDS = MOTION_DURATION_MS.toastVisible / 1000;
const RISE_PX = 4;
const RISE_SECONDS = 0.2;

type Toast = { id: number; message: string };

type FeedbackToastProps = {
  toast: Toast | null;
};

export function FeedbackToast({ toast }: FeedbackToastProps) {
  const isReducedMotion = useReducedMotion();
  // Faded text must not linger for screen readers
  const [endedId, setEndedId] = useState<number | null>(null);

  return (
    <div role="status" className="flex h-8 items-center justify-center">
      {toast && toast.id !== endedId ? (
        <motion.p
          key={toast.id}
          className="rounded-sm border border-line bg-surface-raised px-3 py-1 text-14 leading-5 text-fg"
          initial={{ opacity: 0, y: RISE_PX }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{
            opacity: {
              duration: VISIBLE_SECONDS,
              times: [0, 0.1, 0.8, 1],
              ease: 'easeOut',
            },
            y: { duration: isReducedMotion ? 0 : RISE_SECONDS },
          }}
          onAnimationComplete={() => setEndedId(toast.id)}
        >
          {toast.message}
        </motion.p>
      ) : null}
    </div>
  );
}
