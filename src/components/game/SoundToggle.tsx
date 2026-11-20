'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';
import { SOUND_TOGGLE } from '@/styles/classes';

type Props = {};

const SoundToggle = ({}: Props) => {
  const { isMuted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      aria-label="Mute sounds"
      aria-pressed={isMuted}
      onClick={toggleMuted}
      className={SOUND_TOGGLE}
    >
      {isMuted ? (
        <VolumeX aria-hidden="true" className="size-4" />
      ) : (
        <Volume2 aria-hidden="true" className="size-4" />
      )}
    </button>
  );
};

export default SoundToggle;
