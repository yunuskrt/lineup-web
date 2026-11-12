'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { ProtocolRefused } from '@/components/game/ProtocolRefused';
import { DUEL_FORFEIT_COPY, QuitDialog } from '@/components/game/QuitDialog';
import { useDuel } from '@/hooks/use-duel';
import { usePlayerDirectory } from '@/hooks/use-player-directory';
import { useProAccess } from '@/hooks/use-pro';
import {
  canConfirmForfeit,
  duelCanvasView,
  duelGateAction,
  isProRequired,
} from '@/lib/duel-session';
import { withMode, withQuery } from '@/lib/filters';
import { PRO_PATH } from '@/lib/pro';
import type { LobbyAction } from '@/types/duel-lobby';
import type { PlayMode } from '@/types/play';

export function DuelGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState(() => new URLSearchParams(searchParams));
  const {
    state,
    you,
    lockFilters,
    submitGuess,
    forfeit,
    searchAgain,
    playAgain,
    newRoom,
    leave,
    retry,
    widen,
  } = useDuel(params);
  const directory = usePlayerDirectory(state.session?.sessionId ?? null);
  // Whether New room is offered after a room game
  const hostAccess = useProAccess();
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

  // A new room got a new URL; reloads keep it
  function follow(next: URLSearchParams | null) {
    if (!next) return;
    setParams(next);
    router.replace(withQuery('/play/duel', next));
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
      case 'newRoom':
        setGuess('');
        follow(newRoom());
        return;
    }
  }

  function handleGateAction() {
    switch (duelGateAction(state)) {
      case 'widen': {
        // Play again and Change filters use the wider set
        const next = widen();
        if (!next) return;
        setParams(next);
        router.replace(withQuery('/play/duel', next));
        return;
      }
      case 'leave':
        backToFilters();
        return;
      case 'retry':
        follow(retry());
        return;
      case 'playAgain':
        handlePlayAgain();
        return;
    }
  }

  // See Pro; or a result away, on the profile
  async function handleGateSecondaryAction() {
    if (isProRequired(state)) {
      await leave();
      router.push(PRO_PATH);
      return;
    }
    if (state.phase !== 'endedAway') {
      backToFilters();
      return;
    }
    await leave();
    router.push('/profile');
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
    follow(playAgain());
  }

  if (state.phase === 'refused') {
    return (
      <ProtocolRefused
        backHref={withQuery('/play', withMode(params, 'duel'))}
      />
    );
  }

  return (
    <>
      <GameCanvas
        view={{ ...duelCanvasView(state, you), hostAccess }}
        guess={guess}
        directory={directory}
        onGuessChange={setGuess}
        onGuessSubmit={(text) => void submitGuess(text)}
        onGateAction={handleGateAction}
        onGateSecondaryAction={() => void handleGateSecondaryAction()}
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
