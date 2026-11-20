'use client';

import React from 'react';
import { motion } from 'motion/react';
import FeedbackToast from '@/components/game/FeedbackToast';
import FoundCount from '@/components/game/FoundCount';
import GuessInput, {
  type GuessInputStatus,
} from '@/components/game/GuessInput';
import MatchHeader from '@/components/game/MatchHeader';
import WindowBar from '@/components/home/showcase-frame/WindowBar';
import SquadGrid from '@/components/pitch/SquadGrid';
import { Badge } from '@/components/ui/badge';
import { LOADING_FORMATION } from '@/lib/formation';
import type { Suggestion } from '@/lib/suggestions';
import { MOTION_SECONDS } from '@/styles/motion';
import type { ToastMessage } from '@/types/feedback';
import type { MatchInPlay } from '@/types/match';
import type { FoundPlayer } from '@/types/player';

const IGNORE = () => {};

type Props = {
  match: MatchInPlay | null;
  found: FoundPlayer[];
  value: string;
  status: GuessInputStatus;
  shakeKey: number;
  suggestions: readonly Suggestion[];
  drivenHighlight?: string | null;
  toast: ToastMessage | null;
  isFading: boolean;
};

// Shared by the still frame and the demo
const Stage = ({
  match,
  found,
  value,
  status,
  shakeKey,
  suggestions,
  drivenHighlight,
  toast,
  isFading,
}: Props) => {
  return (
    <div
      inert
      aria-hidden="true"
      className="relative flex flex-col rounded-lg border-2 border-line bg-surface-raised shadow-hard"
    >
      <WindowBar />
      <Badge
        variant="sticker"
        tone="butter"
        tilt="right"
        className="absolute -top-3 right-4 z-10"
      >
        Demo
      </Badge>
      <div className="flex flex-col gap-2 p-2">
        <motion.div
          className="flex flex-col gap-2"
          initial={false}
          animate={{ opacity: isFading ? 0 : 1 }}
          transition={{ duration: MOTION_SECONDS.demoFade, ease: 'easeOut' }}
        >
          <MatchHeader match={match} className="rounded-md" />
          <div className="relative h-80 sm:h-96">
            {match ? <FoundCount found={found} /> : null}
            <SquadGrid
              formation={match?.formation ?? LOADING_FORMATION}
              revealed={found}
              isLoading={!match}
            />
          </div>
        </motion.div>
        {/* No clock in the demo: the input alone */}
        <div className="flex justify-center border-t border-line px-2 pt-3 pb-2">
          <div className="flex w-full min-w-0 flex-col gap-1 sm:max-w-sm">
            <FeedbackToast toast={toast} />
            <GuessInput
              status={status}
              value={value}
              onValueChange={IGNORE}
              onSubmit={IGNORE}
              shakeKey={shakeKey}
              suggestions={suggestions}
              drivenHighlight={drivenHighlight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage;
