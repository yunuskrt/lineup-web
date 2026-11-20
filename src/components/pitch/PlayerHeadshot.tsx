'use client';

import React from 'react';
import { HEADSHOT_SIZE } from '@/components/pitch/styles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';
import type { DuelActor } from '@/types/duel';

const INITIALS_ON_PITCH = 'text-[length:calc(var(--disc)*0.36)]';

// Initials wait this long for a photo, so none flash in
const PHOTO_GRACE_MS = 300;

type Props = {
  name: string;
  imageUrl: string | null;
  // Duel only: fills the disc in the finder's colour
  foundBy?: DuelActor;
  // Replaces the container-sized disc
  sizeClass?: string;
  className?: string;
};

const PlayerHeadshot = ({
  name,
  imageUrl,
  foundBy,
  sizeClass = HEADSHOT_SIZE,
  className = '',
}: Props) => {
  return (
    <Avatar
      aria-hidden="true"
      tone={foundBy ?? 'neutral'}
      className={cn(sizeClass, className)}
    >
      {/* Fetched straight from the CDN, never proxied */}
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
      <AvatarFallback
        delay={imageUrl ? PHOTO_GRACE_MS : undefined}
        className={`leading-none tracking-tight ${
          sizeClass === HEADSHOT_SIZE ? INITIALS_ON_PITCH : 'text-12'
        }`}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default PlayerHeadshot;
