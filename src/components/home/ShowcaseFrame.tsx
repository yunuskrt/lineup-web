'use client';

import { motion } from 'motion/react';
import { type ReactNode, useMemo } from 'react';
import { CountdownRing } from '@/components/game/CountdownRing';
import { FeedbackToast } from '@/components/game/FeedbackToast';
import {
  GuessInput,
  type GuessInputStatus,
} from '@/components/game/GuessInput';
import { MatchHeader } from '@/components/game/MatchHeader';
import { SKELETON_BLOCK } from '@/components/home/LandingSkeleton';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { useDemoPlayback } from '@/hooks/use-demo-playback';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { UNSTARTED_ROUND } from '@/lib/canvas';
import { LOADING_FORMATION } from '@/lib/formation';
import {
  showcaseCaption,
  showcaseFound,
  showcaseSentence,
} from '@/lib/landing';
import { type DemoGuess, demoTimeline } from '@/lib/landing-demo';
import type { Suggestion } from '@/lib/suggestions';
import { QUIT_CHIP } from '@/styles/classes';
import { MOTION_SECONDS } from '@/styles/motion';
import type { Showcase } from '@/types/catalog';
import type { RingMode } from '@/types/countdown';
import type { ToastMessage } from '@/types/feedback';
import type { RoundTiming } from '@/types/game';
import type { ShowcasePlayback } from '@/types/landing';
import type { MatchInPlay } from '@/types/match';
import type { FoundPlayer } from '@/types/player';

const IGNORE = () => {};

const NO_SUGGESTIONS: readonly Suggestion[] = [];

type StageProps = {
  match: MatchInPlay | null;
  found: FoundPlayer[];
  round: RoundTiming;
  ringMode: RingMode;
  value: string;
  status: GuessInputStatus;
  shakeKey: number;
  suggestions: readonly Suggestion[];
  drivenHighlight?: string | null;
  toast: ToastMessage | null;
  isFading: boolean;
};

// Shared by the still frame and the demo
function Stage(props: StageProps) {
  const { match, found, isFading } = props;

  return (
    <div
      inert
      aria-hidden="true"
      className="flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-2"
    >
      <motion.div
        className="flex flex-col gap-2"
        initial={false}
        animate={{ opacity: isFading ? 0 : 1 }}
        transition={{ duration: MOTION_SECONDS.demoFade, ease: 'easeOut' }}
      >
        <MatchHeader match={match} found={found} />
        <div className="h-72 sm:h-80">
          <SquadGrid
            formation={match?.formation ?? LOADING_FORMATION}
            revealed={found}
            isLoading={!match}
          />
        </div>
      </motion.div>
      {/* Phones stack them, as the game's band does */}
      <div className="flex flex-col items-center gap-3 border-t border-line px-2 pt-3 pb-1 sm:flex-row sm:gap-4">
        <CountdownRing round={props.round} mode={props.ringMode} />
        <div className="flex w-full min-w-0 flex-col gap-1 sm:flex-1">
          <FeedbackToast toast={props.toast} />
          <GuessInput
            status={props.status}
            value={props.value}
            onValueChange={IGNORE}
            onSubmit={IGNORE}
            shakeKey={props.shakeKey}
            suggestions={props.suggestions}
            drivenHighlight={props.drivenHighlight}
          />
        </div>
      </div>
    </div>
  );
}

function Caption({
  showcase,
  control,
}: {
  showcase: Showcase;
  control?: ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-6 items-center justify-between gap-4">
        <figcaption className="text-14 text-fg-muted">
          {showcaseCaption(showcase)}
        </figcaption>
        {control}
      </div>
      <p className="sr-only">{showcaseSentence(showcase)}</p>
    </>
  );
}

const FIGURE = 'flex w-full max-w-140 flex-col gap-3 lg:max-w-none';

const STILL_STAGE = {
  round: UNSTARTED_ROUND,
  ringMode: 'frozen',
  value: '',
  status: 'live',
  shakeKey: 0,
  suggestions: NO_SUGGESTIONS,
  toast: null,
  isFading: false,
} as const;

// Reduced motion: nothing moves, the ring included
function ShowcaseStill({ showcase }: { showcase: Showcase }) {
  return (
    <figure className={FIGURE}>
      <Stage
        {...STILL_STAGE}
        match={showcase.match}
        found={showcaseFound(showcase)}
      />
      <Caption showcase={showcase} />
    </figure>
  );
}

function suggestionOf(guess: DemoGuess): Suggestion {
  return {
    player: {
      key: guess.directoryKey,
      name: guess.name,
      imageUrl: guess.imageUrl,
      terms: [],
    },
    isNamed: false,
  };
}

type ShowcaseDemoProps = {
  showcase: Showcase;
  playback: ShowcasePlayback;
};

// Plays the response's script back; decides nothing
function ShowcaseDemo({ showcase, playback }: ShowcaseDemoProps) {
  const timeline = useMemo(() => demoTimeline(showcase), [showcase]);
  const { ref, frame, round, ringMode, isPaused, togglePause } =
    useDemoPlayback(timeline, {
      isEnabled: true,
      startsPaused: playback.startsPaused,
      frozenAtMs: playback.frozenAtMs,
    });
  const revealedKey = frame.revealed.join(' ');
  const found = useMemo(
    () =>
      revealedKey
        .split(' ')
        .filter(Boolean)
        .flatMap((slot) =>
          showcase.players.filter((player) => player.slot === Number(slot)),
        ),
    [revealedKey, showcase.players],
  );
  const suggestions = useMemo(
    () =>
      frame.suggestion ? [suggestionOf(frame.suggestion)] : NO_SUGGESTIONS,
    [frame.suggestion],
  );

  return (
    <figure ref={ref} className={FIGURE}>
      <Stage
        match={showcase.match}
        found={found}
        round={round}
        ringMode={ringMode}
        value={frame.text}
        status={frame.isPending ? 'pending' : 'live'}
        shakeKey={frame.shakes}
        suggestions={suggestions}
        drivenHighlight={
          frame.isHighlighted ? (frame.suggestion?.directoryKey ?? null) : null
        }
        toast={frame.toast}
        isFading={frame.isFading}
      />
      <Caption
        showcase={showcase}
        control={
          playback.frozenAtMs === undefined ? (
            <button
              type="button"
              onClick={togglePause}
              aria-label={isPaused ? 'Play demo' : 'Pause demo'}
              className={`shrink-0 ${QUIT_CHIP}`}
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
          ) : null
        }
      />
    </figure>
  );
}

type ShowcaseFrameProps = {
  showcase: Showcase | null;
  isLoading: boolean;
  playback?: ShowcasePlayback;
};

export function ShowcaseFrame({
  showcase,
  isLoading,
  playback = {},
}: ShowcaseFrameProps) {
  const runs = useMotionPolicy();

  if (showcase) {
    return runs('demoLoop') && !playback.isStill ? (
      <ShowcaseDemo showcase={showcase} playback={playback} />
    ) : (
      <ShowcaseStill showcase={showcase} />
    );
  }
  if (!isLoading) return null;

  return (
    <figure className={FIGURE}>
      <Stage {...STILL_STAGE} match={null} found={[]} />
      <div className="flex min-h-6 items-center">
        <span aria-hidden="true" className={`h-5 w-48 ${SKELETON_BLOCK}`} />
      </div>
    </figure>
  );
}

export function HomeShowcase() {
  const overview = useCatalogOverview();

  return (
    <ShowcaseFrame
      showcase={overview.data?.showcase ?? null}
      isLoading={overview.isPending}
    />
  );
}
