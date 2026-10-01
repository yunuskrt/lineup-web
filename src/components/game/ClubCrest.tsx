'use client';

import Image from 'next/image';
import { useImageFallback } from '@/hooks/use-image-fallback';
import type { ClubRef } from '@/types/match';

// Largest rendered size; CSS sets the box
const CREST_PX = 40;

type ClubCrestProps = {
  club: ClubRef;
  // Rings the crest of the XI being named
  isNamed?: boolean;
};

export function ClubCrest({ club, isNamed = false }: ClubCrestProps) {
  const { showsImage, onError } = useImageFallback(club.crestUrl);

  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm border-2 sm:size-10 ${
        isNamed ? 'border-fg' : 'border-transparent'
      }`}
    >
      {showsImage && club.crestUrl ? (
        // Fetched straight from the CDN, never proxied
        <Image
          src={club.crestUrl}
          alt=""
          width={CREST_PX}
          height={CREST_PX}
          unoptimized
          onError={onError}
          className="size-full object-contain p-0.5"
        />
      ) : (
        <span className="flex size-full items-center justify-center bg-surface-card text-12 leading-none font-semibold text-fg-muted">
          <span className="truncate px-0.5">{club.shortName}</span>
        </span>
      )}
    </span>
  );
}
