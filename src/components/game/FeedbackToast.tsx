'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MOTION_SECONDS } from '@/styles/motion';
import type { ToastMessage } from '@/types/feedback';

const RISE_PX = 4;
const RISE_SECONDS = 0.2;

type FeedbackToastProps = {
  toast: ToastMessage | null;
};

export function FeedbackToast({ toast }: FeedbackToastProps) {
  const runs = useMotionPolicy();
  const riseFrom = runs('toastRise') ? RISE_PX : 0;
  // Faded text must not linger for screen readers
  const [endedId, setEndedId] = useState<number | null>(null);

  return (
    <div role="status" className="flex h-8 items-center justify-center">
      {toast && toast.id !== endedId ? (
        <motion.p
          key={toast.id}
          className="rounded-sm border border-line bg-surface-raised px-3 py-1 text-14 leading-5 text-fg"
          initial={{ opacity: 0, y: riseFrom }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{
            opacity: {
              duration: MOTION_SECONDS.toastVisible,
              times: [0, 0.1, 0.8, 1],
              ease: 'easeOut',
            },
            y: { duration: RISE_SECONDS },
          }}
          onAnimationComplete={() => setEndedId(toast.id)}
        >
          {toast.message}
        </motion.p>
      ) : null}
    </div>
  );
}
