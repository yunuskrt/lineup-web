import React from 'react';
import { LETTER_TILE } from '@/components/profile/styles';
import { cn } from '@/lib/utils';

export type Tile = 'win' | 'draw' | 'loss';

const TILE_LETTERS: Record<Tile, string> = { win: 'W', draw: 'D', loss: 'L' };

const TILE_FILLS: Record<Exclude<Tile, 'draw'>, string> = {
  win: 'bg-you',
  loss: 'bg-danger',
};

type Props = { tile: Tile; isMuted: boolean };

// Decorative: the label beside it is read
const LetterTile = ({ tile, isMuted }: Props) => {
  const letter = TILE_LETTERS[tile];
  if (isMuted) {
    return (
      <span aria-hidden="true" className={cn(LETTER_TILE, 'bg-surface-card')}>
        {letter}
      </span>
    );
  }
  // A draw is shared, so it shows both colours
  if (tile === 'draw') {
    return (
      <span aria-hidden="true" className={LETTER_TILE}>
        <span className="absolute inset-y-0 left-0 w-1/2 bg-you" />
        <span className="absolute inset-y-0 right-0 w-1/2 bg-opponent" />
        <span className="relative">{letter}</span>
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn(LETTER_TILE, TILE_FILLS[tile])}>
      {letter}
    </span>
  );
};

export default LetterTile;
