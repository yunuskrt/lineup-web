'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  COMPETITION_KIND_PATH,
  SHIELD_PATH,
} from '@/components/play/filter-icons';
import { useImageFallback } from '@/hooks/use-image-fallback';
import type { ClubRef, CompetitionRef } from '@/types/match';

// Box is 20px; 40 covers 2x screens
const IMAGE_PX = 40;

type FilterChipImageProps = {
  src: string | null;
  fallback: ReactNode;
};

export function FilterChipImage({ src, fallback }: FilterChipImageProps) {
  const { showsImage, onError } = useImageFallback(src);

  return (
    <span aria-hidden="true" className="flex size-5 shrink-0">
      {showsImage && src ? (
        <Image
          src={src}
          alt=""
          width={IMAGE_PX}
          height={IMAGE_PX}
          unoptimized
          onError={onError}
          className="size-full object-contain"
        />
      ) : (
        fallback
      )}
    </span>
  );
}

export function ClubChipImage({ club }: { club: ClubRef }) {
  return (
    <FilterChipImage
      src={club.crestUrl}
      fallback={
        // Lifts to muted on a pressed chip for contrast
        <svg
          viewBox="0 0 24 24"
          className="size-full fill-current text-fg-dim group-aria-pressed:text-fg-muted"
        >
          <path d={SHIELD_PATH} />
        </svg>
      }
    />
  );
}

export function CompetitionChipImage({
  competition,
}: {
  competition: CompetitionRef;
}) {
  return (
    <FilterChipImage
      src={competition.logoUrl}
      fallback={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-full"
        >
          <path d={COMPETITION_KIND_PATH[competition.kind]} />
        </svg>
      }
    />
  );
}
