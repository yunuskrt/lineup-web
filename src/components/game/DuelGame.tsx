'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { useDuelLobby } from '@/hooks/use-duel-lobby';
import { duelCanvasView, duelGateAction } from '@/lib/duel-lobby';
import { withMode, withQuery } from '@/lib/filters';
import type { LobbyAction } from '@/types/duel-lobby';
import type { PlayMode } from '@/types/play';

export function DuelGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const { state, you, lockFilters, searchAgain, leave, retry } =
    useDuelLobby(params);

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

  return (
    <GameCanvas
      view={duelCanvasView(state, you)}
      // No guessing until the duel loop (W23)
      guess=""
      onGuessChange={() => {}}
      onGuessSubmit={() => {}}
      onGateAction={handleGateAction}
      onQuit={backToFilters}
      onLobbyAction={handleLobbyAction}
    />
  );
}
