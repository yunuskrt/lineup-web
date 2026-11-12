# Pro D: Archive Browse and Search

## Status

Completed

## Goals

A new `/archive` page lists every match in the game, with search and filters. It's for Pro while the switch is on, and open to everyone while it's off. Rows are read-only here; E makes them playable. Needs **Pro A** and backend **R12** on `main`.

- **The contract, transcribed from R12:**
  - `archiveQuerySchema = { q?, competitionId?, clubId?, from?, to?, cursor?, limit? }` and `archivePageSchema = { entries: MatchIdentity[], nextCursor, total }` (`src/lib/api/schemas/catalog.ts`).
  - **`CatalogApi` gains `getArchive(query)`** → `GET /catalog/matches`, in the HTTP client and the mock.
- **The route:** `/archive` in the site shell (`src/app/(site)/(pages)/archive/page.tsx`), with nav and footer.
- **The nav gains "Archive"** (`SiteNav`), beside the account link, on every site page. It shows for everyone, whatever the tier; the page itself handles the lock.
- **The page, open:**
  - The heading "Archive" and the line "{total} matches. Search by club, competition, season or nickname."
  - **Search:** one text box, with the query in the URL as `?q=`. It searches 300ms after typing stops; Enter searches at once.
  - **Filters:** the `/play` filter panel reused (competition, club, era), with its values in the URL as on `/play`. The panel is already one competition at a time; the request sends `competitionId` and `clubId` only when one of each is picked.
  - **Rows:** the date, the competition logo and name, the stage, the home crest and name, the score, the away crest and name, and the nickname when there is one (muted). Same pieces as the side-pick match card, in one line on desktop and two on phones.
  - **Paging:** 20 at a time, then **Show more** (the cursor). The total stays in the heading line.
  - **Empty:** "No match fits. Try fewer words or a wider filter." with Clear search.
  - **Loading:** skeleton rows at the real row height (`theme.md` § Loading). **Error:** the message and Try again.
- **The page, locked** (the switch on, Free or signed out):
  - No list and no request. The heading "Archive", the line "Every match in the game, searchable. Pick one and play it.", and a `ProLock` on **Browse the archive** with "The archive is part of Pro." and See Pro.
  - **Pending:** the skeleton.
- **The switch off:** the page is open for everyone, signed in or not (R12 is public then).
- **The mock:** `getArchive` over the fixtures, with the same search rule (normalized, every word must match), filters, order (newest first) and paging. It refuses an effective-`free` user with `forbidden` + `pro_required` while the switch is on.
- **Dev snapshots:** `/archive?state=` `open`, `locked`, `loading`, `empty`, `error`, `long` (long names and nicknames at 320px).
- **Tests (pure):**
  - Schemas: query bounds and page.
  - URL helpers: `archiveQueryFromParams` and back, round-tripping `q` and the filters.
  - Row formatting (date, stage, nickname present or absent).
  - The mock: search with diacritics and several words, each filter, paging with no repeats, and the refusal.
- **Docs:**
  - `context/design.md` § Page shape: an `/archive` row (index: the page is the list) and the nav's Archive link.
  - `context/docs/contract.md`: `GET /catalog/matches`, `ArchivePage`.
  - `context/docs/pro-features.md`: #2 marked done.

## Layout

```text
Archive
1,924 matches. Search by club, competition, season or nickname.

[ Search the archive…                ]
Competition · Club · Era

12 May 2005  [UCL] Champions League · Final
(crest) AC Milan  3–3  Liverpool (crest)   Miracle of Istanbul
─────────────────────────────────────────────────────────────
…
[ Show more ]
```

## Out of Scope

- **Playing a match from a row:** that's E.
- Sorting choices; the order is newest first.
- **Marking matches you've played:** a later idea.
- Never a lineup, a player or a memorability score (Hard Constraints 2 and 20).

## Open Questions

Defaults stand unless changed at load:

- **The Archive nav link shows for everyone,** including Free while the switch is on (the page shows the lock).
- **Search waits 300ms** after typing stops.

## Notes

- **Source:** user request (2026-11-10), item #2.
- **Order:** fourth of six. Needs A; E builds on it.
- **Hard constraints:**
  - **2:** rows carry `MatchIdentity` only; no squad reaches the client.
  - **20:** no memorability anywhere, not even in the order.
  - **16:** the server refuses Free; the lock is presentation.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters; skeletons match the rows exactly.
- **Deviations recorded during implementation:**
  - **Filters are folded** behind a Filters button (Hide filters when open), with the active ones named beside it ("Champions League, Barcelona"). On an index the list leads; the full `/play` panel is tall.
  - **One club at a time:** picking a second club replaces the first (`withOneClub`), since R12 takes one `clubId`; two picked clubs would otherwise filter by neither.
  - **Rows read as a results table:** the home side is right-aligned to a fixed score column, so scores line up down the list. Phones drop the crests so names get the width; the date, the event ("Champions League quarter-final", from the new shared `matchEvent`) and the nickname sit on the second line. Dates are short ("14 Apr 2026").
  - **The era is always sent** as `from`/`to` (the full range when on Any); results are the same and the query stays simple.
  - **Pending shows only the heading and the skeleton,** with no search box, so no control flashes before a lock.
  - **The empty state's button** reads Clear search when there is a search, else Clear filters (back to Any).
  - **While a new search loads,** the last results stay, dimmed, with `aria-busy` (`keepPreviousData`); the total line is a polite live region.
  - **Shared pieces:** `replaceQuery` moved from `PlayScreen` to `src/lib/filters.ts`; `HistoryMore` takes a `noun` ("matches"); `NAV_LINK` moved to `src/styles/classes.ts` with an `aria-current` style; `ClubCrest` gains a `row` size (32px).
  - **Mock search mirrors R12:** word-prefix, season years and the match year (`src/lib/api/mock/archive.ts`). The cursor is the last id shown; an unknown one is refused with "That page link is no longer valid."
  - **Extra snapshots:** `pending` and `refreshing`, beside the six specced.
  - **Scores confirmed:** live entries carry the match `score`; R12's "no scores" meant memorability.
  - **The mock checks ran as unit tests, not in a browser:** the 3000 server stays in real mode, so the mock's search, filters, paging, refusal and switch-off rules are covered in `src/lib/api/mock/archive.test.ts` and `api-client.test.ts`, and the same screens were checked live against the backend instead.
  - **Checked live** (2026-11-12, 3000 against 8080, ingest database, `PRO_ENABLED=true`): signed out and as Free guest `guest-78xpzx9y`, the locked page and no `/catalog/matches` request. After the tier script made that guest Pro: "1,924 matches", 20 rows; "atletico" 123 with `?q=atletico`; "milan 2005" (Enter) 22, and Show more reached the end with no repeats; Champions League + Liverpool FC gave 37 and kept both in the URL; "2005" on top gave 5 and survived a reload (box, filters, summary); "zzqx" showed the empty state, and Clear search restored 37; picking Barcelona replaced Liverpool. 390 wide: no sideways scroll.
  - **Checked live with `PRO_ENABLED=false`** (ingest): a signed-out visitor got "1,924 matches" and 20 rows with no guest made and no word "Pro"; "barc" found 162 (Barcelona); `/pro` was not found. Build passes.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, Pro:** search "milan", a nickname, and a word with a diacritic; each filter; Show more; the URL keeps `q` and the filters across a reload.
  - **Mock, Free, switch on:** the locked page, and no archive request in the network tab.
  - **Mock, switch off:** open for a signed-out visitor.
  - **Real, ingest, Pro:** about 1,900 matches; the search finds "Istanbul" and "atletico"; paging reaches the end.
  - **Widths:** 320, 390, 768, 1440 with no sideways scroll; skeleton rows match the loaded rows.
