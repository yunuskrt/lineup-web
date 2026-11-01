'use client';

import { useSound } from '@/hooks/use-sound';
import { SOUND_TOGGLE } from '@/styles/classes';

export function SoundToggle() {
  const { isMuted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      aria-label="Mute sounds"
      aria-pressed={isMuted}
      onClick={toggleMuted}
      className={SOUND_TOGGLE}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H2v6h4l5 4z" />
        {isMuted ? (
          <path d="m16 9 6 6m0-6-6 6" />
        ) : (
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        )}
      </svg>
    </button>
  );
}
