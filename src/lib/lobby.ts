import { seasonLabel } from '@/lib/filters';
import type { CanvasGateView } from '@/types/canvas';
import type { FilterOptions } from '@/types/catalog';
import type { DuelActor, DuelPlayer } from '@/types/duel';
import type { DuelLobbyView, FilterSummary } from '@/types/duel-lobby';
import type { EraRange, Filters } from '@/types/filters';

const NAMED_PICKS = 2;

function picked(
  ids: readonly string[],
  options: readonly { id: string; name: string }[],
): string {
  const names = options
    .filter((option) => ids.includes(option.id))
    .map((option) => option.name);

  if (names.length === 0) return 'Any';
  if (names.length <= NAMED_PICKS) return names.join(', ');
  return `${names[0]} + ${names.length - 1} more`;
}

function eraValue(era: EraRange, full: EraRange): string {
  if (era.from === full.from && era.to === full.to) return 'Any season';
  if (era.from === era.to) return seasonLabel(era.from);
  return `${seasonLabel(era.from)} to ${seasonLabel(era.to)}`;
}

export function filterSummary(
  filters: Filters,
  options: FilterOptions,
): FilterSummary {
  return [
    {
      label: 'Competition',
      value: picked(filters.competitionIds, options.competitions),
    },
    { label: 'Club', value: picked(filters.clubIds, options.clubs) },
    { label: 'Era', value: eraValue(filters.era, options.era) },
  ];
}

export function coinFlipTitle(winner: DuelActor, opponent: DuelPlayer): string {
  return winner === 'you'
    ? 'Your filters won'
    : `${opponent.handle}'s filters won`;
}

export function lobbyGate(lobby: DuelLobbyView): CanvasGateView {
  switch (lobby.step) {
    case 'searching':
      return {
        title: 'Finding an opponent',
        detail: "You'll be matched with the next player who's searching.",
      };
    case 'paired':
      return { title: 'Opponent found', detail: 'Filters are next.' };
    case 'filters':
      return {
        title: 'Lock in your filters',
        detail: 'A coin flip picks one set, and the match uses it whole.',
      };
    case 'coinFlip':
      return {
        title: coinFlipTitle(lobby.winner, lobby.opponent),
        detail: 'The match comes from these filters.',
      };
    case 'noOpponent':
      return {
        title: 'No opponent found',
        detail: 'Nobody else is searching right now.',
      };
  }
}
