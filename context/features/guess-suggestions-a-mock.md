# Guess Suggestions A: Popup and Local Search

## Status

Completed

## Goals

- **A suggestion list above the guess input.** While the player types, matching players show as rows, each with a photo and a name. It's a typing aid only: the server's fuzzy matching and every rule stay as they are.
  - **Solo and duel.** The same input in both. In a duel it shows only on your turn, because the input is hidden on theirs.
- **No request while typing (user, 2026-11-06: strictly forbidden).**
  - **One directory per match.** The directory of every player is fetched once per match, when the game route mounts (side pick or lobby, before any clock runs).
  - **Local search.** Every keystroke searches it in the browser.
  - **Photos.** They load only for rows on screen.
- **The contract, transcribed from backend request R5** (`context/docs/backend-requests.md` § R5).
  - **Schemas:** `directoryPlayerSchema = { key, name, imageUrl: string | null, terms: string[] (min 1) }` and `playerDirectorySchema = { players: DirectoryPlayer[] }`, in `src/lib/api/schemas/catalog.ts`. The types come from `z.infer`, in `src/types/catalog.ts`.
    - **`key`:** 22 base64url characters, opaque. It is **not** a player id.
  - **`RevealedPlayer` gains `directoryKey`** (`src/lib/api/schemas/player.ts`): the same string as that player's `DirectoryPlayer.key`. Every shape built on `revealedPlayerSchema` picks it up (found, missed, named, duel found, socket payloads).
  - **Call:** `CatalogApi.getPlayerDirectory(): Promise<ApiResult<PlayerDirectory>>`.
  - **HTTP adapter:** `GET /catalog/players`, validated like every response. R5 has shipped, so real mode gets the directory; until B it's downloaded in full each match (`no-store`).
  - **Mock adapter:** the directory is every fixture player (`PLAYERS`, 167, 20 of them without a photo), with `terms` from their aliases.
    - **Keys:** each fixture player gets a stable 22-character base64url key derived from its id (a hash, so it doesn't sort like the id). The directory is sorted by key, as the backend's is.
    - **Revealed players** from the mock carry the same key as `directoryKey`.
- **The query normalizer moves out of the mock.**
  - `src/lib/api/mock/normalize.ts` becomes `src/lib/normalize.ts`. The mock matcher imports it from there, and its tests move with it.
  - **It's brought in line with the backend's current `normalizeName`** (`lineup-backend/src/game/normalize.ts`): NFKD, all combining marks (`\p{M}`), and format characters (`\p{Cf}`) removed.
  - It only shapes the query to compare with `terms`. If it ever drifts from the backend, suggestions get worse, but no answer changes.
- **Search, pure, in `src/lib/suggestions.ts`.**
  - **`buildSuggestionIndex(players)`:** built once per directory. Each player's searchable terms are their `terms` plus `normalizeName(name)`, deduplicated.
  - **`suggest(index, query, namedKeys)`:**
    - **Minimum:** nothing until the normalized query has **3 letters**, spaces not counted (`MIN_SUGGESTION_LETTERS = 3`).
    - **Start of any word:** a term matches if it starts with the query, or holds the query right after a space. So `ibr`, `zla` and `zlatan ibr` match "Zlatan Ibrahimović", but `movi` doesn't.
    - **Ranking:**
      1. a term equal to the query;
      2. a term starting with it;
      3. a later word starting with it.
      - Ties go by name, then key. Players already named come after all the others.
    - **At most 20 results** (`MAX_SUGGESTIONS = 20`). Each one is `{ player, isNamed }`.
    - **Ranks on text alone.** It never takes the match, the squad or the filters, so the order can't hint at an answer.
- **The directory hook, `usePlayerDirectory()`** (TanStack Query, `queryKeys.playerDirectory`).
  - **When it fetches:** when `SoloGame` or `DuelGame` mounts, again on every mount (`refetchOnMount: 'always'`), and never on window focus.
  - **What it gives back:** the index, memoised from the data, or `null` while loading or after an error.
  - **A failure shows nothing.** No toast and no gate: the input works exactly as it does today. Suggestions aren't a game action, so "never fail silently" doesn't apply. The guess itself still surfaces every failure, as today.
- **Wiring.**
  - **Computing:** `GameCanvas` computes the suggestions from the guess value, through `useDeferredValue`, and from the `directoryKey` of each player in `view.found` (yours and your opponent's in a duel). Never `RevealedPlayer.id`.
  - **Passing:** it hands them to `GuessInput` as a `suggestions` prop.
- **The popup (in `GuessInput`).**
  - **Position:** it sits right above the input (`bottom-full`), as wide as the input, over whatever is above it. It never moves the layout.
  - **Size:** **5 rows visible, then the list scrolls,** up to 20.
  - **Each row is ~44px:** a 32px `PlayerHeadshot` (photo, or initials when there's none), then the name in 14px Inter Medium `fg`, truncated with an ellipsis.
  - **The highlighted row:** `surface-raised`.
  - **A named row:** the name in `fg-muted`, plus a 12px "Named" tag in `fg-muted`. It can't be picked.
  - **The panel:** `surface-card` with a 1px `line` border, `rounded-md`, and no shadow (`theme.md` § Form).
  - **Photos load lazily** (`PlayerHeadshot` is `next/image`, lazy by default), so a row scrolled out of view fetches nothing until it scrolls in.
  - **It shows when:**
    - the input is `live` and focused;
    - there are 3 or more letters;
    - there's at least one result;
    - Escape hasn't closed it.
  - **It's hidden** on pending, locked and cooldown, after a guess is sent, and when there are no results. There's no "no results" row.
- **Picking.**
  - **Tap or click a row and it's guessed at once.**
    - The row's `pointerdown` keeps focus in the input.
    - The input's value becomes the player's name, and that name goes through `onSubmit`.
    - After that it's today's flow: a correct guess clears the input; a name that isn't in the XI shakes it, with the name left in the box.
  - **Keyboard:**
    - Nothing is highlighted at first. ArrowDown and ArrowUp move the highlight, skipping named rows, and scroll the highlighted row into view.
    - The highlight resets when the text changes.
    - **Enter:** with a row highlighted, it guesses that row's name. With none, it sends the typed text, exactly as today.
    - **Escape:** closes the list and keeps the text. Typing again reopens it.
    - **Tab:** behaves as normal.
- **Accessible as a combobox** (ARIA 1.2).
  - **The input:** `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`.
  - **The list:** `role="listbox"`, labelled "Suggested players".
  - **The rows:** `role="option"` with `aria-selected`, and `aria-disabled` on named rows. The photo is `aria-hidden`.
  - A polite status reads "N suggestions" when the count changes.
- **Motion and sound: none.** The list changes on every keystroke, so an entrance would flicker. No new motion effect and no new cue.
- **Dev:**
  - A `suggesting` state on `/dev/canvas` (solo): the query `har`, with the list open. It includes:
    - a named row;
    - a row without a photo;
    - more than 5 rows, so it scrolls.
  - `/dev/guess` gains an "open list" state.
- **Tests (pure):**
  - **`suggestions.test.ts`:**
    - the 3-letter minimum, with spaces not counted;
    - start of any word, and a multi-word query;
    - a match on an alias only;
    - diacritics and Turkish letters (`İbrahimović`, `Şahin`, `ı`);
    - the ranking order, and named players last with `isNamed`;
    - the cap of 20;
    - an empty directory.
  - **`normalize.test.ts`:** moved, with cases added for NFKD and format characters.
  - **The mock and the schema:** the mock directory holds every fixture player, sorted by key, and passes `playerDirectorySchema`. A revealed player's `directoryKey` equals its directory entry's `key`, and no key equals a player id.
- **Docs:**
  - **`context/docs/contract.md`:** call 8, `catalog.getPlayerDirectory` (`GET /catalog/players`), the two types, and `RevealedPlayer.directoryKey`.
  - **`context/docs/data-display-requirements.md`:** a directory row, saying the photo shows in a suggestion row and that rows without one show initials.
  - **`context/theme.md` § States:** a "Suggesting" row in "Duel — your turn", which Solo picks up as identical: "Up to 5 rows above the input, then it scrolls; photo + name; named rows dimmed".

## Layout

Rail, live input, `har` typed:

```text
┌ Suggested players ───────────────┐
│ (●) Dean Harlow                  │  ← highlighted, surface-raised
│ (●) Rhys Harlow          Named   │  ← fg-muted, can't be picked
│ (DH) Daniel Harcourt             │  ← no photo: initials
│ (●) Harry Lindqvist              │
│ (●) Tom Hargreaves               │
│  ⋮  scrolls, up to 20            │
└──────────────────────────────────┘
GUESS A PLAYER            Press Enter ↵
[ har                              ]
```

## Out of Scope

- **The real endpoint and ETag revalidation.** That's Guess Suggestions B, after backend R5.
- **Any change to the guess, the matcher or the rules.** A picked name is a text guess like any other, and the rate limit applies to it the same way.
- **Telling two players with the same name apart** by anything but their photo (club, years). The directory carries only key, name, photo and terms, and the server resolves a bare name within the XI anyway.
- **Ranking by fame or popularity,** and fuzzy or typo matching in the suggestions. The server's matcher already forgives typos on submit.
- **Mobile.** `lineup-mobile` transcribes it later.

## Open Questions

Defaults stand unless changed at load:

- **`project-overview.md` isn't changed.** The suggestions are presentation, and Hard Constraint 2 holds as written, because the directory is the whole table. If you'd like a line in § C (Guess Matching), it has to land in all three repos.
- **Named rows stay in the list,** dimmed and after the others, rather than hidden.
- **The cap of 20 results.**

## Notes

- **Source:** user request (2026-11-06): "While typing a player for guessing the relevant players should be show in the ui. I want to show player photo and his name next to it… sending backend requests and updating the ui, as end user types letter on guess input is strictly forbidden."
- **Decisions (user, 2026-11-06):**
  - **Architecture (approved):** one directory request per match, local filtering, photos on demand.
  - **Freshness:** checked once per match with an ETag (built in B; in A the mock is always fresh).
  - **Pick:** a tap guesses at once; arrows plus Enter; with nothing highlighted, Enter sends the text.
  - **Minimum:** 3 letters.
  - **Duel:** solo and duel.
  - **Named players:** dimmed, tagged "Named", can't be picked.
  - **Rows:** 5 visible, scrolls for more.
  - **Matching:** start of any word.
  - **Split:** A now on the mock, B after the backend.
- **Contract update before load (R5 built, 2026-11-08):**
  - The directory carries an opaque `key`, not `players.id`: uuid v7 ids sort by creation, so listing them all would let one revealed id point at its teammates.
  - Named players are marked by `RevealedPlayer.directoryKey`, a new field. The goals above use the built contract.
- **Deviations recorded during implementation:**
  - **Query key:** `PLAYER_DIRECTORY_QUERY_KEY` in the hook file, as `FILTER_OPTIONS_QUERY_KEY` is; the repo has no `queryKeys` object.
  - **One check per match, by match key, not per mount:** Play again doesn't remount `SoloGame` or `DuelGame`. The hook fetches on mount, then refetches when the solo offer's `sessionId` or the duel session's id changes.
  - **Waits for a session:** a 401 from any query signs the player out, and a first game mount races the guest creation, so the query is enabled only once a session exists.
  - **A failed refetch keeps the last directory** (TanStack keeps its data); `null` only before the first success.
  - **Mock refuses without a session** (`unauthorized`), as the backend does.
  - **`PlayerHeadshot` gained `sizeClass`:** its default size follows a container query, which a 32px class can't override reliably.
  - **Arrow keys wrap** at the ends; the spec didn't say. Pickable rows also highlight on hover.
  - **Dev:** every `?state=` snapshot gets the sample directory, so typing in any of them suggests.
- **Measured cost (2026-11-06):**
  - **Photos:** the scraper's image cache holds 3,620 player photos, 128×128 WebP, median 3.1 KB, at most 7.8 KB. All of them would be ~12 MB, so they're never fetched up front.
  - **The directory (R5's Built note, 2026-11-08):** 3,787 players, 884 KB raw, 229 KB gzip, 193 KB Brotli. About half is the image URLs.
  - **Search:** 3,787 players searched per keystroke takes well under 1 ms.
- **Hard constraints:**
  - **2:** the directory is never scoped, so the XI is indistinguishable within it.
  - **7:** suggestions decide nothing; the server still validates.
  - **15:** both duel players get the same help.
- **Constraints:**
  - Colours come from tokens only.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, at 1440, 390 and 360:**
    - The list appears from the third letter.
    - No network request is sent while typing (DevTools Network, filter `fetch`).
    - Photos fetch only for rows in view.
    - A row without a photo shows initials.
    - A named row is dimmed and can't be picked.
  - **Picking:**
    - A tap on a correct name reveals it.
    - A tap on a wrong one shakes the input, with the name left in it.
    - With nothing highlighted, Enter sends the typed text.
    - Arrows and Enter guess the highlighted row.
    - Escape closes the list.
  - **Duel (mock):** the list shows on your turn only, and the opponent's finds are marked "Named".
  - **States:** pending, locked and cooldown hide the list.
  - **Screen reader:** the combobox roles and the count announcement work, checked with VoiceOver.
  - **Real mode (R5 shipped):** suggestions appear; a failed directory call means none, and the game is unaffected.
