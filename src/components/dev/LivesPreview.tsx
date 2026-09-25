'use client';

import { type ReactNode, useState } from 'react';
import { LifeLostFlash } from '@/components/game/LifeLostFlash';
import { Lives } from '@/components/game/Lives';
import { TurnIndicator } from '@/components/game/TurnIndicator';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { FOCUS_RING } from '@/styles/classes';
import type { DuelActor, DuelPlayer } from '@/types/duel';
import type { Lives as LivesCount } from '@/types/game';

const OWNERS: DuelActor[] = ['you', 'opponent'];
const COUNTS: LivesCount[] = [3, 2, 1, 0];

const PLAYERS: Record<DuelActor, DuelPlayer> = {
  you: { id: 'preview-you', handle: 'northgate_no9', lives: MAX_LIVES },
  opponent: {
    id: 'preview-opponent',
    handle: 'Ciarán O’Donovan-Addo-Mensah',
    lives: MAX_LIVES,
  },
};

const BUTTON = `rounded-sm border border-line px-3 py-1.5 text-14 text-fg hover:bg-surface-raised disabled:text-fg-dim disabled:hover:bg-transparent ${FOCUS_RING}`;

function loseLife(lives: LivesCount): LivesCount {
  return Math.max(lives - 1, 0);
}

type SpecimenProps = {
  label: string;
  children: ReactNode;
};

function Specimen({ label, children }: SpecimenProps) {
  return (
    <figure className="flex flex-col items-start gap-2">
      {children}
      <figcaption className="text-12 text-fg-muted">{label}</figcaption>
    </figure>
  );
}

export function LivesPreview() {
  const [flashKey, setFlashKey] = useState(0);
  const [soloLives, setSoloLives] = useState<LivesCount>(MAX_LIVES);
  const [duel, setDuel] = useState(PLAYERS);
  const [turn, setTurn] = useState<DuelActor>('you');

  function flash() {
    setFlashKey((key) => key + 1);
  }

  function loseSoloLife() {
    setSoloLives(loseLife);
    flash();
  }

  function loseDuelLife(actor: DuelActor) {
    setDuel((players) => ({
      ...players,
      [actor]: { ...players[actor], lives: loseLife(players[actor].lives) },
    }));
    if (actor === 'you') flash();
  }

  function handOver() {
    setTurn((current) => (current === 'you' ? 'opponent' : 'you'));
  }

  function resetDuel() {
    setDuel(PLAYERS);
    setTurn('you');
  }

  return (
    <div className="flex flex-col gap-12">
      <LifeLostFlash flashKey={flashKey} />
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Solo</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={BUTTON}
            disabled={soloLives === 0}
            onClick={loseSoloLife}
          >
            Lose a life
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => setSoloLives(MAX_LIVES)}
          >
            Reset
          </button>
        </div>
        <Specimen label={`You, ${soloLives} left`}>
          <Lives lives={soloLives} />
        </Specimen>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Duel</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} onClick={handOver}>
            Hand over
          </button>
          {OWNERS.map((actor) => (
            <button
              key={actor}
              type="button"
              className={BUTTON}
              disabled={duel[actor].lives === 0}
              onClick={() => loseDuelLife(actor)}
            >
              {actor === 'you' ? 'You lose a life' : 'They lose a life'}
            </button>
          ))}
          <button type="button" className={BUTTON} onClick={resetDuel}>
            Reset
          </button>
        </div>
        <div className="max-w-xl">
          <TurnIndicator you={duel.you} opponent={duel.opponent} turn={turn} />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Static</h2>
        {OWNERS.map((owner) => (
          <div key={owner} className="flex flex-wrap gap-8">
            {COUNTS.map((count) => (
              <Specimen key={count} label={`${owner}, ${count}`}>
                <Lives lives={count} owner={owner} />
              </Specimen>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
