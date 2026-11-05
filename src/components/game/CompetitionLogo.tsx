'use client';

import Image from 'next/image';
import { COMPETITION_KIND_PATH } from '@/components/game/competition-kind';
import { useImageFallback } from '@/hooks/use-image-fallback';
import type { CompetitionRef } from '@/types/match';

// Box is 20px; 40 covers 2x screens
const LOGO_PX = 40;

type CompetitionLogoProps = {
  competition: CompetitionRef;
  // Sets the box size
  className: string;
};

export function CompetitionLogo({
  competition,
  className,
}: CompetitionLogoProps) {
  const { showsImage, onError } = useImageFallback(competition.logoUrl);

  return (
    <span aria-hidden="true" className={`flex shrink-0 ${className}`}>
      {showsImage && competition.logoUrl ? (
        <Image
          src={competition.logoUrl}
          alt=""
          width={LOGO_PX}
          height={LOGO_PX}
          unoptimized
          onError={onError}
          className="size-full object-contain"
        />
      ) : (
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
      )}
    </span>
  );
}
