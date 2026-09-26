'use client';

import { useEffect, useState } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import {
  AFTER_GATE_STATE,
  type CanvasFrame,
  type CanvasSnapshot,
  resolveCanvasState,
  SNAPSHOT_EVENT_DELAY_MS,
} from '@/lib/dev/canvas-states';
import type { CanvasMode } from '@/types/canvas';

type CanvasStatePreviewProps = {
  mode: CanvasMode;
  state?: string | string[];
};

export function CanvasStatePreview({ mode, state }: CanvasStatePreviewProps) {
  // Rendered output never depends on `now`, so SSR matches
  const [snapshot, setSnapshot] = useState<CanvasSnapshot>(() =>
    resolveCanvasState(mode, state).build(Date.now()),
  );
  const [frame, setFrame] = useState<CanvasFrame>(snapshot.frame);

  useEffect(() => {
    const { next } = snapshot;
    if (!next) return;
    const timer = setTimeout(() => setFrame(next), SNAPSHOT_EVENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [snapshot]);

  function openGate() {
    const started = resolveCanvasState(mode, AFTER_GATE_STATE).build(
      Date.now(),
    );
    setSnapshot(started);
    setFrame(started.frame);
  }

  return (
    <GameCanvas
      view={frame.view}
      guess={frame.guess}
      onGuessChange={(guess) => setFrame((current) => ({ ...current, guess }))}
      // Snapshots have no server to send a guess to
      onGuessSubmit={() => {}}
      onGateAction={openGate}
    />
  );
}
