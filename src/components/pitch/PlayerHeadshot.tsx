'use client';

import Image from 'next/image';
import { useImageFallback } from '@/hooks/use-image-fallback';
import { initials } from '@/lib/initials';
import { DUEL_ACTOR_BORDER } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';

// Largest rendered size; CSS sets the disc
const HEADSHOT_PX = 40;

export const HEADSHOT_SIZE = 'size-5 @min-[480px]:size-8 @min-[560px]:size-10';

type PlayerHeadshotProps = {
  name: string;
  imageUrl: string | null;
  // Duel only: rings the disc in the finder's colour
  foundBy?: DuelActor;
  className?: string;
};

export function PlayerHeadshot({
  name,
  imageUrl,
  foundBy,
  className = '',
}: PlayerHeadshotProps) {
  const { showsImage, onError } = useImageFallback(imageUrl);
  const ring = foundBy ? `border-2 ${DUEL_ACTOR_BORDER[foundBy]}` : '';

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised ${HEADSHOT_SIZE} ${ring} ${className}`}
    >
      {showsImage && imageUrl ? (
        // Fetched straight from the CDN, never proxied
        <Image
          src={imageUrl}
          alt=""
          width={HEADSHOT_PX}
          height={HEADSHOT_PX}
          unoptimized
          onError={onError}
          className="size-full object-cover"
        />
      ) : (
        <span className="text-12 leading-none font-semibold tracking-tight text-fg-muted">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
