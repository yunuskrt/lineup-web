import type { HistoryMoreState } from '@/types/profile-screen';
import type { MatchIdentity } from '@/types/match';

export type ArchiveStatus =
  'pending' | 'locked' | 'loading' | 'error' | 'empty' | 'list';

export type ArchiveView = {
  status: ArchiveStatus;
  // Null until the first page answers
  total: number | null;
  entries: MatchIdentity[];
  more: HistoryMoreState;
  // Shown with Try again when status is `error`
  errorMessage?: string;
  // An older page shows while a new search loads
  isRefreshing: boolean;
};
