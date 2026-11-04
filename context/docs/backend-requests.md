# Backend Requests — from lineup-web

Contract changes the web client needs. The backend owns the contract (`coding-standards.md` § The Contract), so each one is a **backend feature first**, merged and running before the web transcribes it. The scraper keeps its own list in `lineup-scraper/context/docs/backend-requests.md`; numbers continue that sequence.

| # | Request | Needed by | Asked | Status |
| --- | --- | --- | --- | --- |
| R3 | Filter options per competition, and competition logos | Web fixes Match Filters A and B | 2026-11-04 | Open |

If the backend has already used R3 for something else, take the next free number and rename it here.

---

## R3. Filter options per competition, and competition logos

**Why:** on `/play` the Club filter lists every club in the pool (about 100 today), whatever competition is picked. The user wants the Club row to show only the clubs of the picked competition. They also want the era dropdowns to offer only that competition's seasons, and a logo on each competition chip. Decided 2026-11-04, web spec `context/fixes/match-filters-a-dependent-clubs.md`.

The web can't work this out itself. `GET /catalog/filter-options` sends competitions and clubs as two flat lists, with nothing linking them. The backend already holds the link: `CatalogService.filterOptions()` reads `selector.candidates()`, and every `PoolCandidate` carries `competitionId`, `clubIds` and `seasonStart`.

### Part 1: competitions carry their clubs and seasons (no migration)

`FilterOptions.competitions` becomes a list of `CompetitionOption`:

| Field | Type | Rule |
| --- | --- | --- |
| …every `CompetitionRef` field | | Unchanged |
| `clubIds` | `string[]` | The pool clubs with at least one pool match in this competition. Every id is also in `FilterOptions.clubs`. Same order as `clubs` (by name, the existing `byName`) |
| `seasonStarts` | `number[]` | The season start years of this competition's pool matches. Ascending, no repeats, never empty. Each is inside `FilterOptions.era` |

- Computed from the same candidates as `poolCoverage`, in one pass. A pure helper next to it in `src/matches/pool-rules.ts` (for example `competitionCoverage(candidates)`), unit tested:
  - a club in two competitions
  - a competition with one match
  - a competition whose matches are all one season
  - order and no repeats
- `FilterOptions.clubs` and `FilterOptions.era` stay as they are. The web still uses the full club list for a search when no competition is picked.
- **Filters request: unchanged.** `competitionIds` stays an array. The web will send at most one id, but that's a UI choice, not a game rule, so the backend doesn't enforce it. The duel coin flip still applies one player's set whole.

### Part 2: competition logos (migration)

- `competitions.logo_key TEXT NULL`: a bucket object key, never a URL, with the same rules as `clubs.crest_key` (a key never starts with `/`).
- **Key scheme for the scraper:** `competitions/<competition-slug>/<sha256-12>.<ext>`, `ext` one of `webp`, `png`, `svg`. Same as crests (`crests/<club-slug>/…`).
- `CompetitionRef.logoUrl: string | null`, set as `assetUrl(ASSET_BASE_URL, logo_key)` in `toCompetitionRef`. That covers every payload that carries a `CompetitionRef`: the catalog, the solo and duel match, the summary, the result and history. `null` stays `null`, as for `crestUrl` (R2).
- Deploy the migration to `dev` and `ingest`.

### Contract and versions

- **Both parts are additive.** Nothing is removed or renamed.
- **The current web keeps working.** Its Zod schemas are plain `z.object`, which drops unknown keys, so a web build from before R3 ignores the new fields.
- **No `PROTOCOL_VERSION` bump.** The duel payloads only gain `competition.logoUrl`.
- Update `context/api-contract.md`, the OpenAPI document and `context/docs/scraper-data-contract.md` (`logo_key`).

### Then

1. **Web, Match Filters A:** transcribes `CompetitionOption` and `logoUrl`, and builds the dependent Club row and the era fit. It needs Part 1 on the backend's `main` for its real-mode check.
2. **Scraper:**
   - Copy `schema.prisma` and `data-contract.md`, then run `npm run db:check`.
   - Extend S18's image list and folders to the pool's competitions: save a logo per competition by hand, upload it, and write `logo_key`.
   - Image guidance is in `lineup-web/context/docs/data-display-requirements.md` § 1, updated by web Match Filters B.
3. **Web, Match Filters B:** draws crests and logos on the chips. Until a competition has a logo, it shows an icon for the competition's kind.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R3. Write it up as a backend feature spec, the way R1 and R2 were done from the scraper's requests. Split it into two features if you think Part 1 and Part 2 should ship separately. Ask me anything unclear before `/feature load`.

### Prompt for the scraper session (after Part 2 is merged and migrated)

> The backend added `competitions.logo_key` (R3 Part 2, see `../lineup-web/context/docs/backend-requests.md`). Copy `schema.prisma` and `data-contract.md`, then spec extending S18 so I can save, upload and load a logo for every pool competition. Use the key scheme `competitions/<competition-slug>/<sha256-12>.<ext>`. Follow the image guidance in `../lineup-web/context/docs/data-display-requirements.md` § 1.
