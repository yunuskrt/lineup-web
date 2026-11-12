'use client';

import Image from 'next/image';
import { useImageFallback } from '@/hooks/use-image-fallback';
import type { ClubRef } from '@/types/match';

export type CrestSize = 'row' | 'header' | 'card';

// Largest rendered size; CSS sets the box
const CREST_PX: Record<CrestSize, number> = { row: 32, header: 40, card: 80 };

const BOX: Record<CrestSize, string> = {
  row: 'size-8',
  header: 'size-8 sm:size-10',
  card: 'size-16 sm:size-20',
};

const FALLBACK_TEXT: Record<CrestSize, string> = {
  row: 'text-12',
  header: 'text-12',
  card: 'text-16',
};

type ClubCrestProps = {
  club: ClubRef;
  // Rings the crest of the XI being named
  isNamed?: boolean;
  size?: CrestSize;
};

export function ClubCrest({
  club,
  isNamed = false,
  size = 'header',
}: ClubCrestProps) {
  const { showsImage, onError } = useImageFallback(club.crestUrl);

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-sm border-2 ${BOX[size]} ${
        isNamed ? 'border-fg' : 'border-transparent'
      }`}
    >
      {showsImage && club.crestUrl ? (
        // Fetched straight from the CDN, never proxied
        <Image
          src={club.crestUrl}
          alt=""
          width={CREST_PX[size]}
          height={CREST_PX[size]}
          unoptimized
          onError={onError}
          className="size-full object-contain p-0.5"
        />
      ) : (
        <span
          className={`flex size-full items-center justify-center bg-surface-card leading-none font-semibold text-fg-muted ${FALLBACK_TEXT[size]}`}
        >
          <span className="truncate px-0.5">{club.shortName}</span>
        </span>
      )}
    </span>
  );
}
