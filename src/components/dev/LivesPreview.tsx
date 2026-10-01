'use client';

import { type ReactNode, useState } from 'react';
import { LifeLostFlash } from '@/components/game/LifeLostFlash';
import { Lives } from '@/components/game/Lives';
import { DuelLivesCard, LivesCard } from '@/components/game/LivesCard';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { DEV_PREVIEW_BUTTON } from '@/styles/classes';
import type { ConnectionState, DuelActor, DuelPlayer } from '@/types/duel';
import type { Lives as LivesCount } from '@/types/game';

const OWNERS: DuelActor[] = ['you', 'opponent'];
const COUNTS: LivesCount[] = [3, 2, 1, 0];

const RECONNECT_WINDOW_MS = 20_000;

const PLAYERS: Record<DuelActor, DuelPlayer> = {
  you: { id: 'preview-you', handle: 'northgate_no9', lives: MAX_LIVES },
  opponent: {
    id: 'preview-opponent',
    handle: 'Ciarán O’Donovan-Addo-Mensah',
    lives: MAX_LIVES,
  },
};

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
  const [turn, setTurn] = useState<DuelActor | null>('you');
  const [isPaired, setIsPaired] = useState(true);
  const [connection, setConnection] = useState<ConnectionState | null>(null);

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

  // A timeout costs a life and hands over at once
  function timeOut() {
    if (turn === null) return;
    loseDuelLife(turn);
    handOver();
  }

  function toggleReconnect() {
    setConnection((current) =>
      current
        ? null
        : {
            status: 'reconnecting',
            reconnectDeadline: Date.now() + RECONNECT_WINDOW_MS,
          },
    );
  }

  function togglePairing() {
    setIsPaired((current) => !current);
    setTurn((current) => (current === null ? 'you' : null));
  }

  function resetDuel() {
    setDuel(PLAYERS);
    setTurn('you');
    setIsPaired(true);
    setConnection(null);
  }

  return (
    <div className="flex flex-col gap-12">
      <LifeLostFlash flashKey={flashKey} />
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Solo</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            disabled={soloLives === 0}
            onClick={loseSoloLife}
          >
            Lose a life
          </button>
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            onClick={() => setSoloLives(MAX_LIVES)}
          >
            Reset
          </button>
        </div>
        <div className="w-full max-w-88">
          <LivesCard lives={soloLives} />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Duel</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            disabled={!isPaired}
            onClick={handOver}
          >
            Hand over
          </button>
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            disabled={turn === null || duel[turn].lives === 0}
            onClick={timeOut}
          >
            Clock runs out
          </button>
          {OWNERS.map((actor) => (
            <button
              key={actor}
              type="button"
              className={DEV_PREVIEW_BUTTON}
              disabled={duel[actor].lives === 0 || !isPaired}
              onClick={() => loseDuelLife(actor)}
            >
              {actor === 'you' ? 'You lose a life' : 'They lose a life'}
            </button>
          ))}
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            aria-pressed={connection !== null}
            disabled={!isPaired}
            onClick={toggleReconnect}
          >
            Opponent reconnecting
          </button>
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            aria-pressed={!isPaired}
            onClick={togglePairing}
          >
            Before pairing
          </button>
          <button
            type="button"
            className={DEV_PREVIEW_BUTTON}
            onClick={resetDuel}
          >
            Reset
          </button>
        </div>
        <div className="w-full max-w-88">
          <DuelLivesCard
            you={duel.you}
            opponent={isPaired ? duel.opponent : null}
            turn={turn}
            opponentConnection={connection}
          />
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
