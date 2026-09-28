'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { DUEL_FORFEIT_COPY, QuitDialog } from '@/components/game/QuitDialog';
import { useDuel } from '@/hooks/use-duel';
import {
  canConfirmForfeit,
  duelCanvasView,
  duelGateAction,
} from '@/lib/duel-session';
import { withMode, withQuery } from '@/lib/filters';
import type { LobbyAction } from '@/types/duel-lobby';
import type { PlayMode } from '@/types/play';

export function DuelGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const {
    state,
    you,
    lockFilters,
    submitGuess,
    forfeit,
    searchAgain,
    playAgain,
    leave,
    retry,
  } = useDuel(params);
  const [guess, setGuess] = useState('');
  const [clearKey, setClearKey] = useState(state.clearKey);
  const [isForfeitOpen, setIsForfeitOpen] = useState(false);
  // Mid-match only; the lobby has nothing to forfeit
  const isForfeitAllowed = canConfirmForfeit(state);

  // A verdict that clears the input, seen once
  if (state.clearKey !== clearKey) {
    setClearKey(state.clearKey);
    setGuess('');
  }

  async function goTo(path: string, mode: PlayMode) {
    await leave();
    router.push(withQuery(path, withMode(params, mode)));
  }

  function backToFilters() {
    void goTo('/play', 'duel');
  }

  function handleLobbyAction(action: LobbyAction) {
    switch (action) {
      case 'cancel':
        backToFilters();
        return;
      case 'lock':
        void lockFilters();
        return;
      case 'solo':
        void goTo('/play/solo', 'solo');
        return;
      case 'searchAgain':
        searchAgain();
        return;
    }
  }

  function handleGateAction() {
    switch (duelGateAction(state)) {
      case 'leave':
        backToFilters();
        return;
      case 'retry':
        retry();
        return;
    }
  }

  function handleQuit() {
    if (isForfeitAllowed) setIsForfeitOpen(true);
    else backToFilters();
  }

  async function confirmForfeit() {
    await forfeit();
    setIsForfeitOpen(false);
  }

  function handlePlayAgain() {
    setGuess('');
    playAgain();
  }

  return (
    <>
      <GameCanvas
        view={duelCanvasView(state, you)}
        guess={guess}
        onGuessChange={setGuess}
        onGuessSubmit={(text) => void submitGuess(text)}
        onGateAction={handleGateAction}
        onQuit={handleQuit}
        onPlayAgain={handlePlayAgain}
        onChangeFilters={backToFilters}
        onLobbyAction={handleLobbyAction}
      />
      <QuitDialog
        // Closes in the render the duel ends in
        isOpen={isForfeitOpen && isForfeitAllowed}
        isQuitting={state.isForfeiting}
        copy={DUEL_FORFEIT_COPY}
        onDismiss={() => setIsForfeitOpen(false)}
        onConfirm={confirmForfeit}
      />
    </>
  );
}
