# Pro D: Archive Browse and Search

## Status

Not Started

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
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, Pro:** search "milan", a nickname, and a word with a diacritic; each filter; Show more; the URL keeps `q` and the filters across a reload.
  - **Mock, Free, switch on:** the locked page, and no archive request in the network tab.
  - **Mock, switch off:** open for a signed-out visitor.
  - **Real, ingest, Pro:** about 1,900 matches; the search finds "Istanbul" and "atletico"; paging reaches the end.
  - **Widths:** 320, 390, 768, 1440 with no sideways scroll; skeleton rows match the loaded rows.
