'use client';

import { type ReactNode, useState, useSyncExternalStore } from 'react';
import { CountdownRing } from '@/components/game/CountdownRing';
import { FOCUS_RING } from '@/styles/classes';
import type { RingMode } from '@/types/countdown';
import type { DuelActor } from '@/types/duel';
import type { RoundTiming } from '@/types/game';

const ROUND_MS = 15_000;

const subscribe = () => () => {};
let pageOpenedAt: number | null = null;

// Null on the server, so rings mount client-side
function getPageOpenedAt(): number {
  pageOpenedAt ??= Date.now();
  return pageOpenedAt;
}

function roundLeaving(remaining: number, now: number): RoundTiming {
  return { startedAt: now - (ROUND_MS - remaining), endsAt: now + remaining };
}

const MODES: RingMode[] = ['running', 'frozen', 'waiting'];

const STATIC_SPECIMENS: {
  label: string;
  remaining: number;
  mode: RingMode;
  owner?: DuelActor;
}[] = [
  { label: 'Calm, 12s', remaining: 12_000, mode: 'frozen' },
  { label: 'Warning, 6s', remaining: 6_000, mode: 'frozen' },
  { label: 'Critical, 2s', remaining: 2_000, mode: 'frozen' },
  { label: 'Time up, 0s', remaining: 0, mode: 'running' },
  { label: 'Waiting, 9s', remaining: 9_000, mode: 'waiting' },
  {
    label: 'Opponent, 9s',
    remaining: 9_000,
    mode: 'frozen',
    owner: 'opponent',
  },
];

type SpecimenProps = {
  label: string;
  children: ReactNode;
};

function Specimen({ label, children }: SpecimenProps) {
  return (
    <figure className="flex flex-col items-center gap-3">
      {children}
      <figcaption className="text-12 text-fg-muted">{label}</figcaption>
    </figure>
  );
}

const BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised aria-pressed:bg-surface-card ${FOCUS_RING}`;

export function RingPreview() {
  const openedAt = useSyncExternalStore(subscribe, getPageOpenedAt, () => null);
  const [restartedAt, setRestartedAt] = useState<number | null>(null);
  const [mode, setMode] = useState<RingMode>('running');

  if (openedAt === null) return null;

  const liveStart = restartedAt ?? openedAt;
  const liveRound = { startedAt: liveStart, endsAt: liveStart + ROUND_MS };

  function restart() {
    setRestartedAt(Date.now());
    setMode('running');
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Live</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} onClick={restart}>
            Restart
          </button>
          {MODES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              className={BUTTON}
              onClick={() => setMode(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-12">
          <Specimen label={`You, ${mode}`}>
            <CountdownRing round={liveRound} mode={mode} />
          </Specimen>
          <Specimen label="Opponent, running">
            <CountdownRing round={liveRound} mode="running" owner="opponent" />
          </Specimen>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Static</h2>
        <div className="flex flex-wrap gap-12">
          {STATIC_SPECIMENS.map((specimen) => (
            <Specimen key={specimen.label} label={specimen.label}>
              <CountdownRing
                round={roundLeaving(specimen.remaining, openedAt)}
                mode={specimen.mode}
                owner={specimen.owner}
              />
            </Specimen>
          ))}
        </div>
      </section>
    </div>
  );
}
