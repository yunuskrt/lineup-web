'use client';

import { useState } from 'react';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { slotLayout } from '@/lib/formation';
import { FOCUS_RING } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';
import type { FoundPlayer } from '@/types/player';

const FORMATIONS = ['4-4-2', '3-5-2'];

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

// Scattered so reveals land across the pitch, not in slot order
const REVEAL_ORDER = [4, 9, 0, 5, 10, 2, 7, 1, 6, 3, 8];

const SNAPSHOT_SIZE = 4;

function playerAt(
  formation: string,
  slot: number,
  foundBy: DuelActor,
): FoundPlayer {
  const point = slotLayout(formation)?.[slot];

  return {
    id: `sample-${slot}`,
    name: SAMPLE_NAMES[slot],
    slot,
    position: point?.position ?? 'GK',
    imageUrl: null,
    foundBy,
  };
}

function nextSlots(revealed: FoundPlayer[], count: number): number[] {
  const taken = new Set(revealed.map((player) => player.slot));
  return REVEAL_ORDER.filter((slot) => !taken.has(slot)).slice(0, count);
}

const BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised disabled:text-fg-dim disabled:hover:bg-transparent aria-pressed:bg-surface-card ${FOCUS_RING}`;

export function RevealPreview() {
  const [formation, setFormation] = useState(FORMATIONS[0]);
  const [revealed, setRevealed] = useState<FoundPlayer[]>([]);
  const [gridKey, setGridKey] = useState(0);
  const isFull = revealed.length === SAMPLE_NAMES.length;

  function reveal(count: number, foundBy: DuelActor) {
    setRevealed((current) => [
      ...current,
      ...nextSlots(current, count).map((slot) =>
        playerAt(formation, slot, foundBy),
      ),
    ]);
  }

  function mountSnapshot() {
    setRevealed(
      nextSlots([], SNAPSHOT_SIZE).map((slot, index) =>
        playerAt(formation, slot, index % 2 === 0 ? 'you' : 'opponent'),
      ),
    );
    setGridKey((key) => key + 1);
  }

  function switchFormation(next: string) {
    setFormation(next);
    setRevealed([]);
    setGridKey((key) => key + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {FORMATIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={formation === option}
            className={BUTTON}
            onClick={() => switchFormation(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={BUTTON}
          disabled={isFull}
          onClick={() => reveal(1, 'you')}
        >
          You reveal next
        </button>
        <button
          type="button"
          className={BUTTON}
          disabled={isFull}
          onClick={() => reveal(1, 'opponent')}
        >
          Opponent reveals next
        </button>
        <button
          type="button"
          className={BUTTON}
          disabled={isFull}
          onClick={() => reveal(2, 'you')}
        >
          Reveal two at once
        </button>
        <button type="button" className={BUTTON} onClick={mountSnapshot}>
          Mount with {SNAPSHOT_SIZE} revealed
        </button>
        <button
          type="button"
          className={BUTTON}
          onClick={() => setRevealed([])}
        >
          Reset
        </button>
      </div>
      <p className="text-12 text-fg-muted">
        {revealed.length} / {SAMPLE_NAMES.length} named
      </p>
      <div className="h-120 max-w-xl rounded-lg border border-line p-2">
        <SquadGrid key={gridKey} formation={formation} revealed={revealed} />
      </div>
    </div>
  );
}
