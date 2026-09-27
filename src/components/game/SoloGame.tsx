'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { QuitDialog } from '@/components/game/QuitDialog';
import { useSoloRun } from '@/hooks/use-solo-run';
import { sideSchema } from '@/lib/api/schemas/common';
import { withQuery } from '@/lib/filters';
import { soloCanvasView, soloGateAction } from '@/lib/solo-run';

export function SoloGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const { state, chooseSide, submitGuess, quit, playAgain, retry } =
    useSoloRun(params);
  const [guess, setGuess] = useState('');
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  // Mid-play only; a gate or summary has its own exit
  const canConfirmQuit =
    state.phase === 'playing' &&
    state.session?.status === 'active' &&
    state.summary === null;

  function leave() {
    router.push(withQuery('/play', params));
  }

  async function handleGuess(text: string) {
    const feedback = await submitGuess(text);
    if (feedback?.clearInput) setGuess('');
  }

  function handleGateAction(choiceId?: string) {
    switch (soloGateAction(state)) {
      case 'choose': {
        const side = sideSchema.safeParse(choiceId);
        if (side.success) void chooseSide(side.data);
        return;
      }
      case 'leave':
        leave();
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
        view={soloCanvasView(state)}
        guess={guess}
        onGuessChange={setGuess}
        onGuessSubmit={handleGuess}
        onGateAction={handleGateAction}
        onQuit={handleQuit}
        onPlayAgain={handlePlayAgain}
        onChangeFilters={leave}
      />
      <QuitDialog
        // Closes in the render the run ends in
        isOpen={isQuitOpen && canConfirmQuit}
        isQuitting={state.isQuitting}
        onDismiss={() => setIsQuitOpen(false)}
        onConfirm={confirmQuit}
      />
    </>
  );
}
