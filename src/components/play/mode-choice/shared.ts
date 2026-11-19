import type { LucideIcon } from 'lucide-react';
import type { DuelActor } from '@/types/duel';
import type { ModeOption } from '@/types/play';

export type ModeCard = {
  option: ModeOption;
  title: string;
  text: string;
  icon: LucideIcon;
  players: DuelActor[];
};
