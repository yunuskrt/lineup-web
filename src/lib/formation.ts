import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import type { SlotPoint } from '@/types/formation';
import type { PositionGroup } from '@/types/player';

const OUTFIELD_SIZE = SQUAD_SIZE - 1;

const GK_Y = 90;
const BACK_LINE_Y = 74;
const FRONT_LINE_Y = 13;
const BAND_LEFT = 3;
const BAND_RIGHT = 97;

// Stand-in shape until the real formation arrives
export const LOADING_FORMATION = '4-4-2';

function lineSizes(formation: string): number[] {
  return formation.split('-').map(Number);
}

export function parseFormation(formation: string): number[] | null {
  const lines = lineSizes(formation);
  const isWholeLines = lines.every(
    (size) => Number.isInteger(size) && size > 0,
  );
  const outfield = lines.reduce((total, size) => total + size, 0);

  return isWholeLines && outfield === OUTFIELD_SIZE ? lines : null;
}

// Slot 0 is the GK; lines fill defence to attack
export function positionForSlot(
  formation: string,
  slot: number,
): PositionGroup | null {
  if (slot === 0) return 'GK';

  const lines = lineSizes(formation);
  let lineStart = 1;

  for (const [index, size] of lines.entries()) {
    if (slot < lineStart + size) {
      if (index === 0) return 'DF';
      return index === lines.length - 1 ? 'FW' : 'MF';
    }
    lineStart += size;
  }

  return null;
}

function lineY(index: number, lineCount: number): number {
  if (lineCount === 1) return BACK_LINE_Y;
  const step = (BACK_LINE_Y - FRONT_LINE_Y) / (lineCount - 1);
  return BACK_LINE_Y - index * step;
}

// Right first: screen right when the team attacks up
function lineX(index: number, size: number): number {
  const spacing = (BAND_RIGHT - BAND_LEFT) / size;
  return BAND_RIGHT - (index + 0.5) * spacing;
}

export function slotLayout(formation: string): SlotPoint[] | null {
  const lines = parseFormation(formation);
  if (!lines) return null;

  const points: SlotPoint[] = [{ slot: 0, position: 'GK', x: 50, y: GK_Y }];

  for (const [lineIndex, size] of lines.entries()) {
    for (let index = 0; index < size; index++) {
      const slot = points.length;
      const position = positionForSlot(formation, slot);
      if (!position) return null;

      points.push({
        slot,
        position,
        x: lineX(index, size),
        y: lineY(lineIndex, lines.length),
      });
    }
  }

  return points;
}
