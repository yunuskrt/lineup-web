'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { QuitDialog } from '@/components/game/QuitDialog';
import { usePlayerDirectory } from '@/hooks/use-player-directory';
import { useSoloAllowance } from '@/hooks/use-solo-allowance';
import { useSoloRun } from '@/hooks/use-solo-run';
import { sideSchema } from '@/lib/api/schemas/common';
import { withMode, withQuery } from '@/lib/filters';
import { ARCHIVE_PATH, withoutPickedMatch } from '@/lib/archive';
import { withPractice } from '@/lib/practice';
import { capLine } from '@/lib/solo-allowance';
import { soloCanvasView, soloGateAction, soloQuitCopy } from '@/lib/solo-run';

export function SoloGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState(() => new URLSearchParams(searchParams));
  const {
    state,
    chooseSide,
    submitGuess,
    quit,
    playAgain,
    retry,
    widen,
    revealMissed,
  } = useSoloRun(params);
  const directory = usePlayerDirectory(state.offer?.sessionId ?? null);
  const allowance = useSoloAllowance();
  const cap = capLine(allowance.data ?? null);
  const [guess, setGuess] = useState('');
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  // Mid-play only; a gate or summary has its own exit
  const canConfirmQuit =
    state.phase === 'playing' &&
    state.session?.status === 'active' &&
    state.summary === null;

  function leave() {
    router.push(withQuery('/play', withoutPickedMatch(params)));
  }

  function backToArchive() {
    router.push(ARCHIVE_PATH);
  }

  // Duels are never capped; the filters go along
  function playDuel() {
    router.push(
      withQuery(
        '/play/duel',
        withMode(withPractice(withoutPickedMatch(params), false), 'duel'),
      ),
    );
  }

  async function handleGuess(text: string) {
    const feedback = await submitGuess(text);
    if (feedback?.clearInput) setGuess('');
  }

  // The run restarts on the widened filters
  async function widenAndRestart() {
    const next = await widen();
    if (!next) return;
    setParams(next);
    router.replace(withQuery('/play/solo', next));
  }

  function handleGateAction(choiceId?: string) {
    switch (soloGateAction(state)) {
      case 'choose': {
        const side = sideSchema.safeParse(choiceId);
        if (side.success) void chooseSide(side.data);
        return;
      }
      case 'widen':
        void widenAndRestart();
        return;
      case 'leave':
        leave();
        return;
      case 'playDuel':
        playDuel();
        return;
      case 'backToArchive':
        backToArchive();
        return;
      case 'retry':
        if (state.failure?.step === 'quit') void confirmQuit();
        else retry();
        return;
    }
  }

  function handleQuit() {
    if (canConfirmQuit) setIsQuitOpen(true);
    else leave();
  }

  async function confirmQuit() {
    await quit();
    setIsQuitOpen(false);
  }

  function handlePlayAgain() {
    setGuess('');
    playAgain();
  }

  return (
    <>
      <GameCanvas
        view={soloCanvasView(state, cap)}
        guess={guess}
        directory={directory}
        onGuessChange={setGuess}
        onGuessSubmit={handleGuess}
        onGateAction={handleGateAction}
        onGateSecondaryAction={leave}
        onQuit={handleQuit}
        onPlayAgain={handlePlayAgain}
        // A picked run, practice or not, goes back
        onChangeFilters={state.pickedMatchId ? backToArchive : leave}
        onPlayDuel={playDuel}
        onRevealMissed={revealMissed}
      />
      <QuitDialog
        // Closes in the render the run ends in
        isOpen={isQuitOpen && canConfirmQuit}
        isQuitting={state.isQuitting}
        copy={soloQuitCopy(state)}
        onDismiss={() => setIsQuitOpen(false)}
        onConfirm={confirmQuit}
      />
    </>
  );
}
