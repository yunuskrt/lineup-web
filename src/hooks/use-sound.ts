'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { listenForUnlock, playCue } from '@/lib/sound/engine';
import { getMuted, setMuted, subscribeMuted } from '@/lib/sound/preference';
import { SOUND_CUES } from '@/styles/sound';
import type { CueSpec, PlayOptions, SoundCue } from '@/types/sound';

// The server always renders sound on
const serverMuted = () => false;

// The duel lobby can chime before any click in it
export function useSoundUnlock() {
  useEffect(() => listenForUnlock(), []);
}

export function useSound() {
  const isMuted = useSyncExternalStore(subscribeMuted, getMuted, serverMuted);

  useSoundUnlock();

  const toggleMuted = useCallback(() => setMuted(!getMuted()), []);

  const play = useCallback(
    (cue: SoundCue | CueSpec, { gainScale }: PlayOptions = {}) => {
      if (getMuted()) return;
      playCue(typeof cue === 'string' ? SOUND_CUES[cue] : cue, gainScale);
    },
    [],
  );

  return { isMuted, toggleMuted, play };
}
