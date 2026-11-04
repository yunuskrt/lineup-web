# Fix — Match Filters A: Dependent Clubs

## Status

Completed

## Goals

- **Contract** (transcribed from backend R3; see Notes):
  - `competitionOptionSchema` in `src/lib/api/schemas/catalog.ts`: `competitionRefSchema` extended with `clubIds: z.array(idSchema)` and `seasonStarts`, an array of season starts (the existing `FIRST_SEASON_START`–`LAST_SEASON_START` bounds), at least one.
  - `filterOptionsSchema.competitions` becomes `z.array(competitionOptionSchema)`. The `CompetitionOption` type comes from `z.infer`.
  - `competitionRefSchema` gains `logoUrl: imageUrlSchema.nullable()`. That covers every payload carrying a competition. This fix only transcribes it and sets it to `null` in the mock; Match Filters B draws it.
  - `context/docs/contract.md` (`FilterOptions`, `CompetitionRef`) and `context/docs/mock-to-backend-map.md` follow.
- **Competition: one or none.** The row works like a radio group of toggle chips:
  - "Any competition" or exactly one competition is pressed, never two.
  - Pressing another competition switches to it.
  - Pressing the pressed competition goes back to "Any competition".
  - `Filters.competitionIds` stays an array, as the backend expects, holding zero or one id.
- **Competitions are grouped.** "Any competition" sits on its own line, followed by three captioned groups:
  - **Leagues:** `league`
  - **European cups:** `ucl`, `uel`
  - **International:** `world_cup`, `euro`
  - Captions are 12px uppercase `fg-muted`, matching the existing small labels.
  - Within a group, chips keep the catalog's order (by name). A group with no competitions isn't shown.
- **Club row with a competition picked:**
  - "Any club", then only that competition's clubs (`clubIds`), as chips in catalog order.
  - **Search box:** shown when the competition has more than 12 clubs. Typing narrows the chips to those that match.
  - Example: with Premier League picked, Real Madrid isn't shown.
- **Club row with no competition picked:**
  - "Any club", a search box, and a hint: "Pick a competition to see its clubs, or search for one."
  - **No club chips until the player types.** Search starts at 2 characters, and covers every club in `FilterOptions.clubs`.
  - **Results:** at most 12, then a line such as "8 more. Keep typing to narrow it down."
  - **Picking clubs across competitions still works,** e.g. every Galatasaray match.
- **Search behaviour** (both states):
  - **Matching:** a club matches when the query is found inside its `name` or `shortName`. Case and accents don't matter: "besiktas" finds Beşiktaş and "atletico" finds Atlético.
    - Folding: NFD with combining marks stripped, lower case, and `ı` → `i`, `ø` → `o`, `ł` → `l`, `đ` → `d`.
    - This is a UI filter over a list the client already holds. It isn't answer matching, and it doesn't reuse the mock's `normalize`.
  - **Selected clubs always show,** pressed, before the results, even when the query hides them.
  - **Reset:** changing the competition clears the query.
  - **Markup:** `<input type="search">` labelled "Search clubs". The hint is linked through `aria-describedby`. A polite live region gives the result count ("3 clubs") while searching all clubs.
- **Club stays multi-select.** When a competition is picked, any selected club that isn't in its `clubIds` is dropped. Going back to "Any competition" keeps the selection.
- **Era fits the competition:**
  - **With a competition picked:** both dropdowns offer only its `seasonStarts`, and "to" is never before "from". With no competition, the full `FilterOptions.era` range is offered, as today.
  - **An untouched era follows the competition.** If the era equals the range the old choice allowed, it becomes the new one's full range.
  - **A narrowed era is kept where it can be.** Each bound moves to the nearest offered season inside the new range. If that leaves "from" after "to", the era resets to the new full range.
- **URL params** (`src/lib/filters.ts`):
  - `competition`: the first known id in URL order. Old links with several competitions keep the first.
  - `club`: known ids only. With a competition, only its clubs.
  - `from` and `to`: snapped to the offered seasons as above, and written only when they differ from the effective range. The effective range is the competition's seasons, or `FilterOptions.era` with no competition.
  - Solo "Change filters", the mode switch and the duel hand-off read and write the same params, unchanged.
- **Widen and summaries:**
  - `widenFilters` with reason `era` resets to the effective range. `competition` clears the competition and keeps the clubs. `club` clears the clubs.
  - `filterSummary` in `src/lib/lobby.ts` reads "Any era" when the era equals that filter set's effective range. That applies to the opponent's set too.
- **Pure helpers** in `src/lib/filters.ts`, each unit tested:
  - `competitionGroups(competitions)`
  - `pickedCompetition(filters, options)`
  - `clubsFor(options, competitionId | null)`
  - `searchClubs(clubs, query)` and its folding
  - `effectiveSeasons(filters, options)`
  - `selectCompetition(filters, id | null, options)`: drops clubs and fits the era
  - `filtersFromParams` and `filtersToParams` for the new rules
- **Mock:**
  - `filterOptionsFrom` in `src/lib/api/mock/pool.ts` derives `clubIds` and `seasonStarts` per competition from the fixtures.
  - Every mock competition gets `logoUrl: null`.
  - `pool.test.ts` checks that every `clubIds` entry is in `clubs`, that seasons are ascending with no repeats, and that each season is inside `era`.
- **`FilterSkeleton`:** matches the new default layout, with no competition picked. That means the "Any competition" line, three captioned groups, and a Club row with one chip, the search box and the hint. Nothing shifts on load.

## Layout

At `md` and up (the label column is unchanged):

```text
Competition   [Any competition]
              LEAGUES
              [Bundesliga] [LaLiga] [Liga Portugal] [Ligue 1] [Premier League] …
              EUROPEAN CUPS
              [Champions League] [UEFA Cup / Europa League]
              INTERNATIONAL
              [Euro] [World Cup]

Club          [Any club]  [⌕ Search clubs              ]        ← no competition
              Pick a competition to see its clubs, or search for one.
              typing "gal" → [Galatasaray]

Club          [Any club] [Arsenal] [Aston Villa] [Chelsea FC] … ← Premier League picked
              (search box only above 12 clubs)

Era           From [2002–03 ▾] to [2022–23 ▾]                   ← the competition's seasons
```

Phones: the same stack. The search box takes the full width under "Any club".

## Out of Scope

- Crests and logos on chips, the kind icon, mock logo images and the image docs: Match Filters B.
- **Narrowing competitions by a picked club**, e.g. picking Galatasaray to show only Galatasaray's competitions. Not asked for.
- **Narrowing clubs by era.** A club in the competition but outside the era stays listed, and the existing empty-pool gate (W25a) handles the rare empty result.
- Tournament season labels: a World Cup start still reads "2006–07", as today.
- `project-overview.md`: its filter line ("competition, club, era range") stays true, so the shared spec isn't edited.

## Open Questions

Defaults stand unless changed at load:

- **Dropped clubs are silent.** When a newly picked competition drops a selected club, nothing announces it; the visible chips show the result.
- **Search box threshold:** shown inside a competition only above 12 clubs. On a smaller list it's noise.
- **Group captions:** "Leagues", "European cups", "International".

## Notes

- **Source:** a user request on 2026-11-04, with the screenshot `context/screenshots/match-filter-section.png`. It shows about 100 club chips under any competition, all text.
- **Decisions** (user, 2026-11-04):
  - **Competition:** one or none.
  - **Club row:** depends on the competition.
  - **No competition picked:** a hint plus a club search.
  - **Club:** stays multi-select.
  - **Groups:** competitions are grouped.
  - **Era:** fits the competition.
  - **Logos:** real logos with a kind-icon fallback, in fix B.
- **Depends on backend R3 Part 1** (`context/docs/backend-requests.md`):
  - **Why:** the catalog has no club-to-competition link today. Building this against the mock alone would leave real mode showing every club.
  - **Before then:** develop and test against the mock (`NEXT_PUBLIC_API_MODE=mock`).
  - **Before `/feature complete`:** the real-mode check needs R3 Part 1 merged and running on the local backend (port 8080).
  - **Part 2 (`logoUrl`):** if it isn't merged yet, the real backend omits `logoUrl`, and the required-nullable field would fail to parse. In that case make it `.nullable().optional()` and record a deviation; tighten it once Part 2 lands.
  - **At load (2026-11-04):**
    - **Part 1 is done:** backend `b9ef744` (R3a), on `main`.
    - **Part 2 isn't:** it's backend R3b. So `logoUrl` ships as `.nullable().optional()`, and Match Filters B tightens it.
- **No game logic.** Which clubs and seasons exist is catalog data the server sends. The client filters a list it was given and decides nothing about a match. The backend still revalidates the filters, and its empty-pool reasons are unchanged.
- **Constraints:** tokens only for colour, chips keep `FILTER_CHIP` and `FOCUS_RING`, `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, at 1440 and 390:**
    - **Defaults:** no competition picked shows the hint and no club chips.
    - **Search:** a search finds a club with an accent typed without it.
    - **Picking:** picking a competition shows only its clubs, and drops a selected club from another competition.
    - **Pressed state:** pressing the picked competition again returns to Any.
    - **Era:** the dropdowns show only that competition's seasons. A narrowed era is kept when it fits.
    - **URL:** the URL round-trips through a reload. An old two-competition link keeps the first competition.
    - **Lobby and empty pool:** the duel lobby summary still reads correctly, and the empty-pool widen still works.
    - **Skeleton:** no layout shift from skeleton to loaded.
  - **Real mode**, with backend R3 Part 1: the screenshot's catalog with Premier League picked lists no Real Madrid, and World Cup lists nations only.
- **Deviations recorded during implementation**
  - **Group captions are sentence case,** 12px medium `fg-muted`, not uppercase. The `frontend-design` pass flags all-caps labels as a templated tell, and the captions read fine without it.
  - **Selected clubs show in catalog order among the results,** not before them. A chip that jumped to the front when pressed would move under the pointer.
  - **An empty search says so:** "No club matches that name."
  - **The live region counts results in both search states,** not only when searching all clubs.
  - **Inside a competition, search narrows from 1 character, with no cap.** The 2-character minimum and the 12-result cap apply only to the all-clubs search.
  - **The lobby summary keeps its existing wording, "Any season",** where the spec said "Any era". It now compares against the effective range.
  - **"Nearest offered season inside the new range" moves each bound inward:** "from" to the first offered season at or after it, "to" to the last at or before it. If none fits, the era resets.
  - **The search box is 16px on phones (`FILTER_SEARCH`),** so iOS doesn't zoom on focus. It's 14px from `sm` up, and it joins the focus-ring guard.
  - **Helpers added beyond the list:** `clubRowView` (the whole club row as data, so the component holds no rules), `fitEra`, `rangeOf`, `searchKey` and `COMPETITION_GROUPS`. `seasonStartSchema` is now exported from `common.ts` for `seasonStarts`.
  - **The skeleton's hint is the real copy,** in transparent text on the skeleton fill, so it wraps exactly as the loaded hint does (two lines at 360).
  - **The search query resets on a new competition by keying the club row on the competition,** not by clearing state in an effect.
  - **Review fix: widening away the competition now goes through `selectCompetition(filters, null)`.**
    - **The bug:** before, `widenFilters('competition')` only cleared the id. An untouched era stayed on the old competition's range (World Cup's 2002–2022, say) and was written to the URL as a narrowed era.
    - **Now:** the era follows to the full catalog, and the clubs are kept. Tested.
- **Verification results**
  - **Checks:**
    - `npm test` passes: 1,174 tests after `/feature test`, including new suites for every helper and the mock derivation.
    - **Added at `/feature test`:** a `competitionOptionSchema` suite (`catalog.test.ts`), `filterSummary` against a competition's range, and the mock sorting seasons from unordered fixtures.
    - **Mutation check:** 13 hand-made mutations of the new rules were all caught by a failing test:
      - in `filters.ts`: era fitting, the untouched-era follow, URL ranges and clubs, the widen, accent folding, empty groups, the search minimum and cap, selected clubs, and the one-competition pick
      - the lobby era summary
      - the mock season sort, which survived at first and got the reversed-fixtures test
    - `npm run lint` is clean.
    - `tsc --noEmit` is clean.
  - **Mock, on a production build at port 3100** (your dev server untouched):
    - **Defaults:** shows the hint and no club chips.
    - **Search:** "y" alone shows nothing, and "yildirim" finds Yıldırımspor. A selected club stays shown when the query is cleared.
    - **Picking Crown League:** drops Yıldırımspor and lists its three clubs. The era offers 2002 and 2014 only.
    - **Pressing it again:** returns to Any and the full era.
    - **Narrowed era:** 2010–2013 resets on Crown League, because no Crown League season falls inside it.
    - **URL:** round-trips a reload. An old two-competition link keeps the first competition and its clubs.
    - **Empty pool:** the gate's "Include every club" clears only the clubs. "Change filters" returns with everything kept.
    - **Duel lobby:** reads "Crown League / Any / Any season".
    - **Skeleton:** no shift. Row heights match the loaded page: 307/109/78 at 1440, 426/188/111 at 390, 426/209/111 at 360. No sideways scroll at 390.
  - **Real mode** (dev server on 3000, backend `b9ef744` on 8080, `ingest` data):
    - Premier League lists its 6 clubs, with no Real Madrid.
    - World Cup lists 37 nations, and the era offers its 6 tournament years.
    - Champions League's 45 clubs get the search box.
    - "besiktas" finds Beşiktaş.
