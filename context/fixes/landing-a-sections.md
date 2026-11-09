# Fix — Landing A: Sections and Numbers

## Status

Completed

## Goals

- **`/` grows from two sections to six**, on the mock adapter, as `context/docs/landing-page-improvements.md` describes: fold, archive, how it plays, two ways to play, what's inside, closing. That doc is the reference; where this spec is more exact, this spec wins.
- **The contract, ahead of backend R7** (as Private Rooms A did for R6; `context/docs/backend-requests.md` § R7):
  - **Schemas** in `src/lib/api/schemas/catalog.ts`:
    - `catalogOverviewSchema`: `counts` (`matches`, `players`, `clubs`, `nationalTeams`, `seasons`), `era`, `highlights` (`finals`, `shootouts`, `extraTime`, `goals`), `competitions: CompetitionRef[]`, `topClubs: ClubRef[]` (at most 12), `showcase: Showcase | null`. Every count is a non-negative integer.
    - `showcaseSchema`: `match: MatchInPlay`, `players` (exactly 11 `showcasePlayerSchema`, one per slot), `demo`.
    - `showcasePlayerSchema`: `revealedPlayerSchema` without `directoryKey`.
    - `showcaseDemoSchema`: `reveals` (1–11 distinct slots that are in `players`), `miss: { name, imageUrl } | null`.
  - **Types** from `z.infer` in `src/types/catalog.ts`.
  - **`CatalogApi.getOverview()`**: the HTTP adapter calls `GET /catalog/overview` with the transport's default cache. The backend doesn't exist yet; until R7, real mode gets an error and the page takes its error path.
  - **Mock adapter:**
    - It computes the overview from the mock dataset, the same way R7 counts: playable fixtures only, distinct players, clubs and national teams split by kind, distinct season start years, finals, shootouts, extra time, goals, competitions, and the top 12 clubs by fixture count.
    - The **showcase is a fictional fixture** from the mock dataset (user, 2026-11-09), never a copy of the real XI. Its `demo` has 5 reveals (forwards and midfielders) and a miss from the other side's XI.
    - **The mock pool excludes the showcase fixture**, mirroring R7, so the mock never serves it as a game.
- **`useCatalogOverview`** in `src/hooks/`, shaped like `useFilterOptions`: a `queryOptions`, a one-hour `staleTime`, `unwrap`.
- **A client fetch, not server rendering.** The `ApiClient` is browser-side (credentials, one mock store per tab), so the page reads the overview the way `/play` reads filter options. The fold's text stays server-rendered and needs no data.
- **Fold** (`HomeFold`):
  - From `lg`, a two-column grid: the statement, line, Play and sign-in line on the left, unchanged, and **the showcase** on the right. Below `lg`, it is stacked: the text, then the showcase at full width (at most about 560px).
  - **The text never moves:** the right column is the showcase, its skeleton while loading, or empty when `showcase` is null or the call fails.
  - The fold keeps its full-viewport height from `lg` only. Below `lg` it sizes to its content, so the top of the showcase shows on the first screen.
  - **The showcase in A is a still frame:** the match header (`MatchHeader`), the pitch and `SquadGrid` in the showcase's formation, with the `demo.reveals` slots filled and the rest empty, and the ring drawn full and still. Fold B animates the same component. It is also the reduced-motion frame.
  - **Caption** under it: "{Club}'s XI, {date}", with the date formatted as on the scoreboard (for example "Real Madrid's XI, 23 April 2017").
  - The frame is `inert` and `aria-hidden`; screen readers get one sentence: "A turn being played: five of {Club}'s starting eleven named against the clock." The count follows `demo.reveals`.
  - **Fixed aspect ratio** for frame and skeleton, so nothing shifts.
- **The archive** (`HomeArchive`, new):
  - Four figures with labels: "real matches", "players", "clubs and nations", "seasons". Under the row, the era range as `lobby.ts` writes it ("2000–01 to 2025–26").
  - Exact numbers with thousands separators (`en` locale), `tabular-nums`, `font-display`, 32px below `sm` and 48px from `sm`. 64px stays reserved for the countdown.
  - **Count-up:** once, the first time the row is in view and the data is there, 800ms, ease-out, through Motion. The visible digits are `aria-hidden`, beside a visually hidden final value. With reduced motion, the final value shows at once. A new motion effect `countUp` in `MOTION_EFFECTS` (`drop` under reduced motion) and a `countUp: 800` duration entry, with `motion.test.ts` extended.
  - 2 × 2 below `sm`, 4 in a row from `sm`.
- **How it plays:** `HomeRules`, unchanged.
- **Two ways to play** (`HomeModes`, new):
  - Two columns from `sm` (stacked below), each a heading, one line and links.
  - **Solo:** "Your filters, your pace. Name the XI before your three lives run out." Link "Play solo" → `/play?mode=solo`.
  - **Duel:** "Live 1v1 on one shared XI. Spend the easy names before they do." Links "Find a duel" → `/play?mode=duel` and "Play a friend" → `/play?mode=duel#play-a-friend`. `RoomControls`' section gains `id="play-a-friend"`.
  - These are `TEXT_LINK` weight, never a second primary button.
- **What's inside** (`HomeInside`, new):
  - **Competitions:** each logo (`CompetitionLogo`, 24px) with its name, in the `competitionGroups` order (leagues, European cups, international), wrapping. Not buttons.
  - **Most-played clubs:** `topClubs` as crests (`ClubCrest`, 40px), wrapping, in the response's order. Each crest's name is its `alt`; the list is labelled "Most-played clubs". A crest that fails falls back to `shortName`, as elsewhere.
  - **Highlights:** four figures with labels: "finals", "penalty shootouts", "went to extra time", "goals". 2 × 2 below `sm`, 4 in a row from `sm`. No count-up here.
- **Closing:** the statement footer (`SiteFooter variant="statement"`) gains a "Play" link (`TEXT_LINK`, 16px) after the statement: on the same line from `sm`, below it on phones.
- **Loading and failure:**
  - **Loading:** the archive and highlights show flat skeletons of their final size (`theme.md` § Loading), the crest and logo rows show skeleton blocks, and the showcase shows the W15 skeleton grid.
  - **Error:** the archive and what's inside are left out, and the showcase column is empty. The fold, rules and modes render as normal. No zeros, no error copy, no retry button on a marketing page.
  - **`showcase: null`:** only the showcase column is empty.
- **Responsive:** no sideways scroll at 320, 375, 768, 1024 and 1440px. The crest and logo rows wrap; numbers fit their cells (check a 5-digit count at 320px).
- **Dev:** `/dev/landing?state=` renders the page body on fixed data:
  - `ready`, `loading`, `down`, `no-showcase`;
  - `long`, with 5-digit counts and long competition names.
- **Tests (`*.test.ts`):**
  - schema: a valid overview passes; 10 players, a reveal slot not in `players`, a duplicate reveal or a 13th top club are rejected;
  - mock: the overview's counts match the mock dataset, the showcase fixture is never selected for a solo run or a duel, and its miss is not in the named XI;
  - helpers: the count label and the era line.
- **Docs:**
  - `context/docs/contract.md`: § 3 gains `CatalogOverview`, `Showcase`, `ShowcasePlayer`, `ShowcaseDemo`, and § 4 lists `GET /catalog/overview`.
  - `context/design.md` § Page shape: the `/` row becomes "Statement fold with the showcase, then the archive, rules, modes and what's inside".

## Layout

```text
lg and up                                      below sm
┌──────────────────────────┬─────────────────┐ ┌──────────────────┐
│ KNOW THE XI.             │ RMA 2–3 BAR     │ │ KNOW THE XI.     │
│ BEAT THE CLOCK.          │ pitch, 5 filled │ │ BEAT THE CLOCK.  │
│ You get one team…        │ ring (still)    │ │ You get one…     │
│ [ Play ]                 │                 │ │ [ Play ]         │
│ No sign-up needed…       │ caption         │ │ ┌──────────────┐ │
├──────────────────────────┴─────────────────┤ │ │  showcase    │ │
│ 1,924    3,787    100          26          │ │ └──────────────┘ │
│ real matches  players  clubs and nations…  │ │ 1,924   3,787    │
│ 2000–01 to 2025–26                         │ │ 100     26       │
├────────────────────────────────────────────┤ │ rules            │
│ rules strip (unchanged)                    │ │ Solo             │
├─────────────────────┬──────────────────────┤ │ Duel             │
│ Solo                │ Duel                 │ │ logos (wrap)     │
├─────────────────────┴──────────────────────┤ │ crests (wrap)    │
│ logos + names (wrap) / crests (wrap)       │ │ highlights 2 × 2 │
│ 56 finals  53 shootouts  84 ET  5,348 goals│ │ footer + Play    │
├────────────────────────────────────────────┤ └──────────────────┘
│ ELEVEN NAMES. FIFTEEN SECONDS.     Play    │
└────────────────────────────────────────────┘
```

The numbers are the real ones for scale (R7 will report the exact figures). The mock shows its own.

## Out of Scope

- **The demo's motion** (typing, reveals, the ring sweeping, pause): Landing B.
- **The real endpoint:** Landing C, after backend R7.
- Community activity, a derby count, most-started players (`landing-page-improvements.md` § 3).
- Crests or logos as links into `/play` filters: a club needs its competition (Fix Match Filters A), so a crest alone can't make a valid URL.
- Page metadata built from the counts: it would need server data. The static description stays.
- Any restyle of other routes.

## Open Questions

Defaults stand unless changed at load:

- **The copy** in the modes section is a first draft; change it at load if you prefer other lines.
- **"clubs and nations"** as one label for clubs plus national teams. The split (53 + 47 today) is in the response if you'd rather show two figures.

## Notes

- **Deviations recorded during implementation:**
  - **Showcase players carry `directoryKey`** (full `RevealedPlayer`), and `demo.miss` is `{ name, imageUrl, directoryKey }`. `SquadGrid` takes `FoundPlayer`, and Landing B's suggestion rows key on it. R7 in `backend-requests.md` updated to match.
  - **The mock showcase is `match-continental-2019-semi`** (Northgate's XI; reveals Nwosu, Şimşek, Rowntree, Benedetti, Pritchard; miss Samuel Ekwueme). It is the one fixture no test names, and leaving it out keeps the mock's era range and every filter non-empty. `PLAYABLE_FIXTURES` in `pool.ts` is the new default for selection, empty-pool checks and filter options.
  - **Mock fixtures gain optional `extraTime` and `shootout`** (set on the two 3–3 finals), so the mock's highlights aren't zero. The game never reads them.
  - **Tests that counted every fixture now count the playable ones**, and "narrows by competition" uses the Crown League (the Continental Cup has one playable fixture left).
  - **The headline is two lines from `lg`** (`whitespace-nowrap` per sentence, a 6 : 5 column split). In half the width it broke into three ("Beat the / Clock.").
  - **The rules strip lost its closing line** ("Play solo, or take someone on live in a 1v1 duel."): the new modes section right below says the same. The spec said `HomeRules` unchanged.
  - **The showcase's ring and input stack on phones**, as the game's band does: side by side, the 144px ring left the input about 80px at 320.
  - **Crests use `ClubCrest`'s `header` size:** 32px below `sm`, 40px from `sm`.
  - **The era line reads "Seasons 2000–01 to 2025–26."**; a bare range under the numbers read as unlabelled.
  - **`CatalogOverview` and `Showcase` sit in `contract.md` § 4 › Response types**, beside `FilterOptions`, where the other response shapes live, rather than § 3.
  - **`HomeFold` takes an optional `showcase` slot**, so `/dev/landing` can pass a fixed frame; the page passes nothing and gets the fetched one.
  - **The competition row's skeleton is approximate:** 8 placeholders (two rows wide), since the real row's height depends on how many competitions there are and how long their names are. Every other skeleton matches its loaded height (measured at 375 and 1440).
- **Source:** user request (2026-11-09), decisions in `context/docs/landing-page-improvements.md` § 1, the match and mock decisions from 2026-11-09 (`backend-requests.md` § R7).
- **Order:** Landing A → Landing B → (backend R7, any time before C) → Landing C.
- **Hard limits:** no Three.js or WebGL; no sideways scroll at any width; no game logic in the page (the still frame only draws slots it's given).
- **Never hardcode a colour;** the page uses the existing role tokens. New component tokens, if any, are named per `design.md` § Token architecture.
