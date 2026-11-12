import type { z } from 'zod';
import type {
  archivePageSchema,
  archiveQuerySchema,
  catalogOverviewSchema,
  competitionOptionSchema,
  directoryPlayerSchema,
  filterOptionsSchema,
  overviewCountsSchema,
  overviewHighlightsSchema,
  playerDirectorySchema,
  showcaseDemoSchema,
  showcaseMissSchema,
  showcaseSchema,
} from '@/lib/api/schemas/catalog';

export type CompetitionOption = z.infer<typeof competitionOptionSchema>;
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
export type DirectoryPlayer = z.infer<typeof directoryPlayerSchema>;
export type PlayerDirectory = z.infer<typeof playerDirectorySchema>;
export type OverviewCounts = z.infer<typeof overviewCountsSchema>;
export type OverviewHighlights = z.infer<typeof overviewHighlightsSchema>;
export type ShowcaseMiss = z.infer<typeof showcaseMissSchema>;
export type ShowcaseDemo = z.infer<typeof showcaseDemoSchema>;
export type Showcase = z.infer<typeof showcaseSchema>;
export type CatalogOverview = z.infer<typeof catalogOverviewSchema>;
export type ArchiveQuery = z.input<typeof archiveQuerySchema>;
export type ArchivePage = z.infer<typeof archivePageSchema>;
