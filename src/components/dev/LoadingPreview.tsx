'use client';

import { useState } from 'react';
import { CanvasGate } from '@/components/game/CanvasGate';
import { GuessInput } from '@/components/game/GuessInput';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { LOADING_FORMATION, slotLayout } from '@/lib/formation';
import { FOCUS_RING } from '@/styles/classes';
import type { FoundPlayer } from '@/types/player';

const FORMATIONS = [LOADING_FORMATION, '3-5-2', '4-3-3'];

const ARRIVAL_FORMATION = '3-5-2';

const SAMPLE_NAMES = [
  'Gareth Pennock',
  'Dean Harlow',
  "Ciarán O'Donovan",
  'Stuart Fenwick',
  'Rhys Harlow',
  'Christophe Delacroix-Morel',
  'Íñigo Castañeda',
  'Jasper van der Linde',
  'Kofi Addo-Mensah',
  'Tavinho',
  'Wes Tolland',
];

const SNAPSHOT_SLOTS = [0, 4, 7, 10];

type GateSample = {
  label: string;
  title: string;
  detail?: string;
  actionLabel?: string;
};

const GATES: GateSample[] = [
  { label: 'Matchmaking', title: 'Finding an opponent', actionLabel: 'Cancel' },
  {
    label: 'Reconnecting',
    title: 'Reconnecting, 18s',
    detail: 'Your clock is still running',
  },
  { label: 'Pre-match', title: 'Match ready', actionLabel: 'Start' },
];

const BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised aria-pressed:bg-surface-card ${FOCUS_RING}`;

const PRIMARY_BUTTON = `rounded-sm bg-brand px-4 py-1.5 text-14 font-semibold text-on-accent ${FOCUS_RING}`;

function snapshotPlayers(formation: string): FoundPlayer[] {
  const points = slotLayout(formation) ?? [];
  return SNAPSHOT_SLOTS.map((slot) => ({
    id: `sample-${slot}`,
    name: SAMPLE_NAMES[slot],
    slot,
    position: points[slot]?.position ?? 'GK',
    imageUrl: null,
    foundBy: slot % 2 === 0 ? 'you' : 'opponent',
  }));
}

export function LoadingPreview() {
  const [isLoading, setIsLoading] = useState(true);
  const [formation, setFormation] = useState(LOADING_FORMATION);
  const [revealed, setRevealed] = useState<FoundPlayer[]>([]);
  const [gate, setGate] = useState<GateSample | null>(null);
  const [value, setValue] = useState('');
  const [canvasClicks, setCanvasClicks] = useState(0);
  const [submissions, setSubmissions] = useState(0);

  function startLoading() {
    setRevealed([]);
    setIsLoading(true);
  }

  function finishLoading() {
    setFormation(ARRIVAL_FORMATION);
    setRevealed(snapshotPlayers(ARRIVAL_FORMATION));
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-12 text-fg-muted">Loading</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={isLoading}
            className={BUTTON}
            onClick={() => (isLoading ? setIsLoading(false) : startLoading())}
          >
            Loading
          </button>
          {FORMATIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={formation === option}
              className={BUTTON}
              onClick={() => setFormation(option)}
            >
              {option}
            </button>
          ))}
          <button type="button" className={BUTTON} onClick={finishLoading}>
            Finish loading with {SNAPSHOT_SLOTS.length} revealed
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-12 text-fg-muted">Gate</p>
        <div className="flex flex-wrap gap-2">
          {GATES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              aria-pressed={gate?.label === sample.label}
              className={BUTTON}
              onClick={() => setGate(sample)}
            >
              {sample.label}
            </button>
          ))}
          <button
            type="button"
            className={BUTTON}
            onClick={() => setGate(null)}
          >
            Close
          </button>
        </div>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface-raised p-2">
        <CanvasGate
          isOpen={gate !== null}
          title={gate?.title ?? ''}
          detail={gate?.detail}
          action={
            gate?.actionLabel ? (
              <button
                type="button"
                className={PRIMARY_BUTTON}
                onClick={() => setGate(null)}
              >
                {gate.actionLabel}
              </button>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-2">
            <div
              className="h-96"
              onClick={() => setCanvasClicks((count) => count + 1)}
            >
              <SquadGrid
                formation={formation}
                revealed={revealed}
                isLoading={isLoading}
              />
            </div>
            <GuessInput
              status="live"
              value={value}
              onValueChange={setValue}
              onSubmit={() => setSubmissions((count) => count + 1)}
              shakeKey={0}
            />
          </div>
        </CanvasGate>
      </div>
      <p className="text-12 text-fg-muted">
        Canvas clicks: {canvasClicks} · Guesses submitted: {submissions}
      </p>
    </div>
  );
}
