'use client';

import React, { useMemo } from 'react';
import Caption from '@/components/home/showcase-frame/Caption';
import { NO_SUGGESTIONS } from '@/components/home/showcase-frame/shared';
import Stage from '@/components/home/showcase-frame/Stage';
import { FIGURE } from '@/components/home/showcase-frame/styles';
import { useDemoPlayback } from '@/hooks/use-demo-playback';
import { type DemoGuess, demoTimeline } from '@/lib/landing-demo';
import type { Suggestion } from '@/lib/suggestions';
import { QUIT_CHIP } from '@/styles/classes';
import type { Showcase } from '@/types/catalog';
import type { ShowcasePlayback } from '@/types/landing';

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

type Props = {
  showcase: Showcase;
  playback: ShowcasePlayback;
};

// Plays the response's script back; decides nothing
const ShowcaseDemo = ({ showcase, playback }: Props) => {
  const timeline = useMemo(() => demoTimeline(showcase), [showcase]);
  const { ref, frame, isPaused, togglePause } = useDemoPlayback(timeline, {
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
};

export default ShowcaseDemo;
