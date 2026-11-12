# Backend Requests — from lineup-web

Contract changes the web client needs. The backend owns the contract (`coding-standards.md` § The Contract), so each one is a **backend feature first**, merged and running before the web transcribes it. The scraper keeps its own list in `lineup-scraper/context/docs/backend-requests.md`; numbers continue that sequence.

| # | Request | Needed by | Asked | Status |
| --- | --- | --- | --- | --- |
| R3 | Filter options per competition, and competition logos | Web fixes Match Filters A and B | 2026-11-04 | **Done**: Part 1 (2026-11-04, backend R3a), Part 2 (2026-11-05, backend R3b) |
| R4 | The match on the solo offer, and the order and time of each named player | Web fixes Gameplay Visuals B and C | 2026-11-06 | **Done**: Part 1 (2026-11-06, backend R4a), Part 2 (2026-11-06, backend R4b) |
| R5 | A player directory for guess suggestions | Web features Guess Suggestions A and B | 2026-11-06 | **Done** (2026-11-08, backend R5): an opaque `key`, not `players.id` |
| R6 | Private rooms: create a room, join it with a code | Web features Private Rooms A and B | 2026-11-08 | **Done** (2026-11-08): rooms (backend R6a), history `isPrivate` (backend R6b) |
| R7 | A catalog overview for the landing page, with a showcase match | Web fixes Landing A, B and C | 2026-11-09 | **Done** (2026-11-09, backend R7 `d5cdcb6`): 5-minute server cache |
| R8 | Three more reveals in the landing showcase | Web fix Landing D | 2026-11-10 | **Done** (2026-11-10, backend R8 `aca22bf`) |
| R9 | The Pro tier and the `PRO_ENABLED` switch | Web feature Pro A | 2026-11-10 | **Done** (2026-11-12, backend R9 `fcf2079`) |
| R10 | Pro-only room hosting | Web feature Pro B | 2026-11-10 | **Done** (2026-11-12, backend R10 `d7d53ca`) |
| R11 | The solo daily cap | Web feature Pro C | 2026-11-10 | **Done** (2026-11-12, backend R11 `35f1ce3`) |
| R12 | Archive browse and search | Web feature Pro D | 2026-11-10 | Asked |
| R13 | Exact match selection | Web feature Pro E | 2026-11-10 | Asked |
| R14 | Practice mode | Web feature Pro F | 2026-11-10 | Asked |

If the backend has already used a number for something else, take the next free one and rename it here.

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
- **Built** (2026-11-04): backend `b9ef744` (R3a), on `main` and pushed.
  - **Payload:** `GET /catalog/filter-options` sends `competitions` as `CompetitionOption[]`: every `CompetitionRef` field, plus `clubIds` and `seasonStarts`, as specified above.
  - **Unchanged:** `clubs`, `era` and the `Filters` request. No `PROTOCOL_VERSION` change.
  - **Docs:** `CompetitionOption` is in the OpenAPI document and in backend `context/api-contract.md` § FilterOptions.
  - **Checked on `dev`:** 6 competitions, each with 2–3 clubs and 1–2 seasons.

### Part 2: competition logos (migration)

- `competitions.logo_key TEXT NULL`: a bucket object key, never a URL, with the same rules as `clubs.crest_key` (a key never starts with `/`).
- **Key scheme for the scraper:** `competitions/<competition-slug>/<sha256-12>.<ext>`, `ext` one of `webp`, `png`, `svg`. Same as crests (`crests/<club-slug>/…`).
- `CompetitionRef.logoUrl: string | null`, set as `assetUrl(ASSET_BASE_URL, logo_key)` in `toCompetitionRef`. That covers every payload that carries a `CompetitionRef`: the catalog, the solo and duel match, the summary, the result and history. `null` stays `null`, as for `crestUrl` (R2).
- Deploy the migration to `dev` and `ingest`.
- **Built** (2026-11-05): backend `a266849` (R3b), on `main` and pushed.
  - **Payload:** every `CompetitionRef` always carries `logoUrl`: an absolute https URL (`<ASSET_BASE_URL>/<logo_key>`) or `null`. That covers the catalog (`CompetitionOption` inherits it), the solo and duel match, the summary, the result and history.
  - **Unchanged:** every other field. No `PROTOCOL_VERSION` change.
  - **Data:** every competition's `logoUrl` is `null` until the scraper uploads logos, so the web shows the kind icon meanwhile.

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

---

## R4. The match on the solo offer, and the order and time of each named player

**Why:** the user is reworking three gameplay surfaces (2026-11-06). Two of them need data the web doesn't get today. The third, the competition logo on the scoreboard, needs nothing: `MatchInPlay.competition.logoUrl` already flows (R3b).

### Part 1: `SoloMatchOffer` carries the match (no migration)

The "Pick your side" card before a solo run becomes a match card: both crests and names, the score, the competition's logo and name, and the date. Web spec: `context/fixes/gameplay-visuals-b-side-pick-card.md`.

Today `POST /solo/sessions` answers with `SoloMatchOffer = { sessionId, home, away }`, so the web has the clubs but not the competition, the date or the score.

| Field | Type | Rule |
| --- | --- | --- |
| `sessionId`, `home`, `away` | | Unchanged |
| `match` | `MatchIdentity` | **New.** The offered match, exactly as `SoloSession.match` will carry it once a side is picked, without `side` and `formation`. `match.home` and `match.away` equal `home` and `away` |

- The backend already holds it: `SoloService.start()` keeps an `OfferedRun` whose `offer.match` is that match. Map it through the same `toMatchIdentity` path the summary uses.
- **Safe to send:** `MatchIdentity` holds no player of either XI (Hard Constraint 2). The duel lobby already shows the same identity before play.
- `home` and `away` stay so a web build from before R4 keeps working. They can go in a later cleanup once every client reads `match`.
- **Built** (2026-11-06): backend `0d85bd2` (R4a), on `main` and pushed.
  - **Payload:** `POST /solo/sessions` answers with `SoloMatchOffer = { sessionId, match, home, away }`. `match` is the full `MatchIdentity`: the competition with `logoUrl`, the season, date and stage, both clubs with `crestUrl`, the score and the nickname. It never holds a player.
  - **Deprecated:** `home` and `away` are marked deprecated in OpenAPI. They equal `match.home` and `match.away`; read `match` instead.
  - **Unchanged:** REST only, so no `PROTOCOL_VERSION` change.
  - **Docs:** backend `context/api-contract.md` § SoloMatchOffer.

### Part 2: each named player's order and time (no migration, no new writes)

The middle of the solo summary and the duel result becomes a list of the players named, in the order they were named, with the seconds each took. In a duel, each row is in the finder's colour. Web spec: `context/fixes/gameplay-visuals-c-named-order.md`.

Today `found` carries `RevealedPlayer` (plus `foundBy` in a duel) with no order and no time. `roundTimesMs` can't stand in for it: it has a row for every round, including the ones that ended in a lost life, so it doesn't line up with the names.

`SoloSummary.found[]` and `DuelResult.found[]` each gain two fields:

| Field | Type | Rule |
| --- | --- | --- |
| `order` | integer 1–11 | The position in which this player was named in the session. 1 is the first. Unique within `found`, no gaps |
| `elapsedMs` | integer 0–15000 | The server's receipt of the correct guess minus the start of the round it landed in. Capped at `ROUND_MS`, as `roundTimesMs` is, so a guess inside the grace window reads 15000 |

- **Sort `found` by `order`** in both payloads.
- **Duel:** the round is the finder's own turn, so `elapsedMs` is how long the finder took on that turn.
- **The data already exists.**
  - The solo summary is built from the run's `TimedEffect` stream (`src/game/summary.ts`, `runFigures`). That stream has `round_started.startedAt` and each `guess_resolved` with a `correct_new` verdict. The order and elapsed time fall out of the same pass.
  - The duel result has the same effects.
  - On disk, `game_rounds.started_at` and `guesses.received_at` (with `player_id`) hold the same facts for a run read back later.
  - **Nothing new is written to the database.**
- **Not in live payloads.** `SoloSession.found`, `DuelSession.found` and `correct_new.player` stay as they are. The order and time are only needed once the session has ended.
- Keep `accuracy`, `bestStreak` and `roundTimesMs` on `SoloSummary`. The web stops showing them, but they stay in the contract (the profile has its own stats).
- **Tests** (in the `game` module, pure):
  - a run with a lost life between two names
  - a guess in the grace window (capped at 15000)
  - a perfect clear (orders 1–11)
  - a run quit before any name (`found` empty)
  - a duel where the names alternate between the two players
- **Built** (2026-11-06): backend `57d45e8` (R4b), on `main` and pushed.
  - **Payload:** `SoloSummary.found` is `NamedPlayer[]` and `DuelResult.found` is `DuelNamedPlayer[]`: the old entry (plus `foundBy` in a duel) with `order` (1–11, no gaps, sorted) and `elapsedMs` (0–15000, capped; in a duel, the finder's own turn).
  - **Unchanged:** `SoloSession.found`, `DuelSession.found`, `playerRevealed`, `correct_new.player` and `missed`. `accuracy`, `bestStreak` and `roundTimesMs` are still sent. No `PROTOCOL_VERSION` change.
  - **New failure case:** if the backend can't build a step's events, both players get an `error` event (`server_error`) instead of them. At the end of a duel that replaces `finished`. Web Gameplay Visuals C handles it.
  - **Docs:** OpenAPI, and backend `context/api-contract.md`.

### Contract and versions

- **Both parts are additive.** Nothing is removed or renamed.
- **The current web keeps working:** its `z.object` schemas drop unknown keys.
- **No `PROTOCOL_VERSION` bump.** `DuelResult` is a socket payload, but it only gains fields; a client on the old version ignores them.
- Update `context/api-contract.md` and the OpenAPI document (`SoloMatchOffer`, `SoloSummary`).

### Then

1. **Web, Gameplay Visuals A** (scoreboard logo) needs nothing from here and can ship first.
2. **Web, Gameplay Visuals B** (side-pick card) needs Part 1 on the backend's `main` for its real-mode check.
3. **Web, Gameplay Visuals C** (named order) needs Part 2 on the backend's `main` for its real-mode check.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R4. Write it up as backend feature specs, R4a (offer carries the match) and R4b (named order and time on the summary and the duel result), the way R3 was done. Both are additive, with no migration. Ask me anything unclear before `/feature load`.

---

## R5. A player directory for guess suggestions

**Why:** while a player types a guess, the web will show matching players in a list above the input, each with a photo and name (user, 2026-11-06). The server's fuzzy matching doesn't change: a picked suggestion is sent as the same text guess as today.

**The rule this request exists for:** typing must never send a request. So the web downloads a directory of every player **once per match**, before the clock starts (during the side pick or the lobby), and filters it in the browser on every keystroke. Photos are links in the directory; the browser downloads a photo file only when its row is on screen. Web specs: `context/features/guess-suggestions-a-mock.md` and `context/features/guess-suggestions-b-wiring.md`.

### The endpoint: `GET /catalog/players` (no migration)

| Field | Type | Rule |
| --- | --- | --- |
| `players` | `DirectoryPlayer[]` | **Every** player with at least one alias. Never scoped to a match, a filter, the pool or a session |
| `players[].id` | uuid | `players.id`, the same id `RevealedPlayer.id` carries, so the web can mark players already named |
| `players[].name` | string | `players.name`, the display form, diacritics kept |
| `players[].imageUrl` | string \| null | `assetUrl(assetBase, imageKey)`, as `RevealedPlayer.imageUrl` (the `imageUrl` rule) |
| `players[].terms` | string[] | The player's distinct `player_aliases.normalized` values, at least one. The web searches these; it never shows them |

- **Hard Constraint 2 holds because the directory is the whole table.** The 11 answers sit among ~3,787 players and nothing marks them. That's why it must never be narrowed: a directory scoped to the match's clubs, season, competition, the player's filters or the pool would leak the XI. Ordering must not carry a signal either: sort by `id`.
- **Never sent:** `slug`, `transfermarktId`, `imageKey`, lineups, matches, positions, or anything else about where a player played.
- **Who can call it:** any session, guest included (the web only asks from a game route, where a session always exists). Not `@Public()`. Rate-limited with the `catalog` limit or a new one; a normal player makes one call per match.
- **No game logic moves.** The web uses the directory only to suggest. It still sends a typed (or picked) name, and the server still decides everything.

### Freshness: one cheap check per match

The scraper writes straight to Postgres, so new or edited players can arrive at any time without the backend being told.

- **A version for the directory**, cheap to compute on every request, that changes whenever a player or alias is added, edited or deleted. For example: row counts plus the latest `updated_at` of `players` and `player_aliases`.
- **Keep the built directory in memory**, and rebuild it only when the version changes. A request whose version matches costs one small aggregate query.
- **Headers:** a strong `ETag` from that version, and `Cache-Control: private, no-cache` (the browser keeps the copy but must ask before using it).
- **`If-None-Match` equal to the current ETag → `304 Not Modified`**, with no body. The web's fetch sends that header itself (browser HTTP cache), so a match where nothing changed costs a few hundred bytes.

### Compression

The backend doesn't compress responses today. The directory is ~600 KB of JSON raw and should be ~150 KB gzipped, so it needs gzip or Brotli. Global `compression` middleware is fine if it leaves Socket.IO and Better Auth alone; compressing only this route is fine too.

### Contract and versions

- **Additive:** a new route, nothing else changes. No `PROTOCOL_VERSION` bump (REST only).
- Document it in OpenAPI (`PlayerDirectory`, `DirectoryPlayer`) and `context/api-contract.md`.
- **Measure and report** in the Built note: player count, raw and compressed size on the real database, and the time a 200 and a 304 take.

### Tests

- **Pure mapping:** distinct `terms`, a player without an image gets `imageUrl: null`, a player without aliases is left out, the order is by `id`, and no field outside the four above.
- **Version:** it changes when a player is added, an alias is added or edited, and a player is deleted; it stays the same otherwise.
- **HTTP:** a first call gets 200 with an `ETag`; a call with that `If-None-Match` gets 304; a guest session gets 200; no session gets 401.

### Built

- **Built** (2026-11-08): backend `e78adda` (R5), on `main` and pushed.
  - **Endpoint:** `GET /catalog/players`, any session, guests included; no session gets 401. The `catalog` rate limit, 60 a minute. The usual envelope around `PlayerDirectory = { players: DirectoryPlayer[] }`: every player with at least one alias, sorted by `key`, never scoped.
  - **Changed from the request: `key`, not `id`.** `DirectoryPlayer` is `{ key, name, imageUrl, terms }`.
    - `key` is 22 base64url characters, opaque and stable. It isn't `players.id`.
    - **Why:** ids are uuid v7, so players loaded together sort next to each other. On the seeded data, 6.3 of a starter's 10 nearest ids were teammates. With every id listed, one revealed id would point at the rest of the XI (Hard Constraint 2).
  - **Marking named players:** `RevealedPlayer` gains `directoryKey`, equal to that player's `DirectoryPlayer.key`. It appears everywhere a revealed player does: `SoloSession.found`, `correct_new.player`, `missed`, `DuelFoundPlayer`, `NamedPlayer`, `DuelNamedPlayer`, and the socket payloads. Match on `directoryKey`, never `RevealedPlayer.id`.
  - **Fields:** `name` is the display form, diacritics kept. `imageUrl` is an absolute URL or null, the `RevealedPlayer.imageUrl` rule. `terms` are the normalised aliases, distinct, sorted, at least one; searched, never shown.
  - **Caching:** a strong `ETag` and `Cache-Control: private, no-cache`. `If-None-Match` with the current tag gets 304 with no body. CORS allows `If-None-Match` and exposes `ETag`.
  - **Compression:** Brotli when accepted, else gzip, with `Vary: Accept-Encoding`.
  - **Measured:** 3,787 players. 884 KB raw, 229 KB gzip, 193 KB Brotli; about half of it is the image URLs. The first build after a data change takes ~2.4 s; after that a 200 or a 304 costs ~65 ms on the server, nearly all of it the database round trip.
  - **Unchanged:** additive, a new route and a new field. No `PROTOCOL_VERSION` bump.
  - **Docs:** OpenAPI (`PlayerDirectory`, `DirectoryPlayer`, `RevealedPlayer.directoryKey`) and backend `context/api-contract.md`.
- **Checked from the web** (2026-11-08, web Guess Suggestions B, 3000 against 8080 on the seeded data):
  - The first call is a 200, `content-encoding: br`, with the strong `ETag` and `private, no-cache`. Play again sends `If-None-Match` and gets no body back.
  - The shapes match the web's transcription. `directoryKey` arrives on solo reveals and duel socket payloads: in a two-browser duel each side's finds show as named for the other.
  - The local database holds the 167 seeded players (6,162 bytes Brotli, no photos), so the production sizes above weren't re-measured from the browser.

### Then

1. **Web, Guess Suggestions A** (popup, local search, keyboard, on the mock directory) needs nothing from here and can ship first.
2. **Web, Guess Suggestions B** (real endpoint, ETag revalidation, real-mode checks) needs R5 on the backend's `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R5. Write it up as a backend feature spec, R5 (player directory for guess suggestions), the way R4 was done: `GET /catalog/players` with an ETag from a cheap directory version, 304 on a match, the built directory kept in memory, and gzip or Brotli on the response. No migration. Keep it unscoped (Hard Constraint 2) and session-only. Ask me anything unclear before `/feature load`.

---

## R6. Private rooms: create a room, join it with a code

**Why:** players want to duel a friend, not only a stranger (user, 2026-11-08). The public queue stays exactly as it is. A second way in is added: one player **creates a room** and gets a **code**, and their friend **joins with that code**. A room holds two players. Once both are in, the game is today's duel. Web specs: `context/features/private-rooms-a-mock.md` and `context/features/private-rooms-b-wiring.md`.

**Decisions (user, 2026-11-08):**

- **Anyone can create and join**, guests included. Pro gating (the Free vs Pro row "Private lobbies: Free join only, Pro host + join") is a later decision, not enforced now.
- **The creator's filters are used.** They're fixed when the room is created; there's no filter window and no coin flip in a room.
- **On join, the game starts at once**, after a short beat that names the creator's filters.
- **The code** is 6 characters from letters and digits without look-alikes, shared by copy or by a link.
- **A room waits 10 minutes** for the friend, then closes.
- **Room games count in stats** like any duel; history marks them.
- **Rematch is a later request.** Not part of R6.

### The shape: a second way to pair

Today `MatchmakingService.enter` pairs two queued players with `DuelRooms.open(first, second)`, sends `paired` to both, and everything after (filters, coin flip, load, play, result, reconnect, persistence) runs from there. A room only adds a new way to reach the pairing, and skips the filter window.

### Socket commands (acked with the §2 envelope, `data` empty; outcomes arrive as events)

| Command | Payload | Errors in the ack |
| --- | --- | --- |
| `room:create` | `Filters` | `forbidden` (already queued, already hosting a room, or in a duel), `invalid_input`, `empty_pool` + `emptyBecause` (checked now, so a friend never joins a room with no match; nothing is stored) |
| `room:join` | `{ code }`: 6 characters, any case | `not_found` (no open room has that code: wrong, expired or closed), `forbidden` (your own room, the room is full, you're queued, hosting or in a duel), `invalid_input` (not 6 characters of the code alphabet) |
| `room:leave` | — | `forbidden` (not hosting an open room) |

- **Rate limits** (B42's per-user socket limit): `room:join` needs a tight one (for example 10 a minute), so codes can't be guessed by trying. `room:create` can share the others' limit.
- **Queue and rooms exclude each other.** A host can't `queue:enter`; a queued player can't create or join.

### Server events

| Event | Payload | When |
| --- | --- | --- |
| `roomCreated` | `RoomState` | To the creator, after an accepted `room:create` |
| `roomExpired` | `RoomExpiry` | To the creator, 10 minutes after `roomCreated` if no one joined. The room is gone and the code is free |
| `paired` | `PairedState` (unchanged) | To both, at once on an accepted `room:join` |
| `coinFlip` | `CoinFlipResult` + **new** `source` | To both, right after `paired`. In a room, `winner` is **the creator** (from each receiver's view) and `filters` are the room's |
| `matchReady` | `DuelSession` (unchanged) | 2 s after that `coinFlip`, as today |

Everything after `matchReady` is unchanged: turns, reveals, lives, reconnect window, forfeit, `finished`.

**New and changed types**

| Type | Fields |
| --- | --- |
| `RoomState` | `code` (6 characters, uppercase), `filters: Filters` (as applied), `expiresAt: epoch ms` |
| `RoomExpiry` | `code` |
| `CoinFlipResult` | `winner: DuelActor`, `filters: Filters`, **`source: 'coin' \| 'room'`**. `coin` for a queue pairing, `room` for a room |

### Rules

- **The code:** 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no `0 O 1 I L`); about 887 million codes. Unique among open rooms. `room:join` uppercases what it's given before matching. A code is never reused while its room is open.
- **One open room per creator.** Creating again while hosting is `forbidden`; `room:leave` first.
- **The creator's connection:** the room lives while the creator is connected. If the creator's socket closes (or is taken over) before anyone joins, the room closes at once, like leaving the queue. No reconnect window before the pairing.
- **The 10-minute wait:** a server-owned timer (a constant, injectable for tests like `QUEUE_TIMEOUT_MS`). `expiresAt` lets the web show the time left; the web never decides the expiry.
- **Joining:** the joiner becomes seat 1, the creator seat 0. After that the room is full: a third `room:join` with the same code is `not_found` (the open room is gone) or `forbidden` (full), whichever is simpler, as long as it's documented.
- **Who starts:** in a duel, the player who loses the coin flip names first. In a room there's no flip, so **the joiner names first** (the creator's filters were used). Document it if a different rule is simpler.
- **Empty pool between create and join:** the filters were checked on create. If the pool empties before the friend joins (an ingest run), the existing `empty_pool` error event after `coinFlip` applies ("No match fits the winning filters."), and both are told.
- **Hard Constraint 2 holds:** no squad leaves the server; a room only changes how two players meet.
- **Hard Constraint 15 holds:** a room changes nothing about the rules; both players face identical rules.

### Persistence (one migration)

- **`game_sessions` gains a flag** for a room game, for example `is_private BOOLEAN NOT NULL DEFAULT false`, or an `origin` enum (`queue`, `room`) if you'd rather leave room for more later. Written when the duel is persisted (B41).
- **History:** the duel variant of `HistoryEntry` (`GET /profile/history`) gains **`isPrivate: boolean`**. The web tags those rows "vs friend".
- **Stats unchanged:** room games count toward wins, losses, draws, accuracy and streaks like any duel.
- No code is stored: rooms are ephemeral, in memory, like the queue (Hard Constraint 6).

### Contract and versions

- **Additive:** three new commands, two new events, one new field on `CoinFlipResult` and one on the history entry. A web build from before R6 never sends a room command and ignores the new fields.
- **No `PROTOCOL_VERSION` bump** needed for that reason. If you see one, say why in the Built note.
- Document it in `context/api-contract.md` (socket section) and OpenAPI for the history entry (`isPrivate`).

### Tests

- **Rooms (pure where possible):** create gives a code from the alphabet, unique while open; join pairs creator (seat 0) and joiner (seat 1); join is case-insensitive; a wrong code is `not_found`; joining your own room, a full room, or while queued is `forbidden`; leave frees the code; the timer expires the room with `roomExpired`; the creator's disconnect closes it.
- **Start:** after a join, `paired` → `coinFlip` (`source: room`, `winner` = creator, room filters) → `matchReady`; no `filtersUpdated`; the joiner names first. A queue pairing still sends `source: coin`.
- **Two-client harness (B43):** a room game from create to `finished`, and one where the creator leaves while waiting.
- **Persistence:** a room duel is saved with the flag, and its history rows have `isPrivate: true`; a queue duel has `false`.
- **Rate limit:** a burst of `room:join` is refused with `rate_limited` + `retryAfterMs`.

### Built

- **Rooms** (2026-11-08): backend `e7a722b` (R6a), on `main` and pushed.
  - **Commands** (acked with the envelope, `data` null; outcomes arrive as events):
    - `room:create` takes `Filters`. Errors: `forbidden` (queued, already hosting, or in a duel), `invalid_input`, `empty_pool` + `emptyBecause`. The pool is checked on create; nothing is stored if it's empty.
    - `room:join` takes `{ code }`, 6 characters **in any case** (the backend uppercases before checking). Errors: `not_found` (wrong, expired, left, or **already joined: a full room also answers `not_found`**), `forbidden` (your own room, or you're queued, hosting or in a duel), `invalid_input` (not 6 characters of `ABCDEFGHJKMNPQRSTUVWXYZ23456789`).
    - `room:leave` takes nothing. Error: `forbidden` (not hosting an open room).
  - **Events:** `roomCreated` sends `RoomState { code (uppercase), filters, expiresAt }` to the creator; `roomExpired` sends `RoomExpiry { code }` to the creator after 10 minutes with no join.
  - **On join:** both get `paired`, then `coinFlip` with `source: 'room'` (`winner` is the creator: `you` to the creator, `opponent` to the joiner; `filters` are the room's), then `matchReady` 2 s later. No `filtersUpdated`. **The joiner names first.** A queue pairing now sends `source: 'coin'`. Everything from `matchReady` on is unchanged.
  - **Rules:** queue and rooms exclude each other; the room closes when the creator leaves, or at once when the creator's socket closes or is taken over (no reconnect window).
  - **Rate limits:** `room:join` and `room:create` are **10 a minute each**.
  - **No `PROTOCOL_VERSION` bump** (additive).
  - **Docs:** OpenAPI and `x-socket` (`RoomState`, `RoomExpiry`, `RoomJoinRequest`, `CoinFlipSource`); backend `context/api-contract.md` § 5, "Private rooms (R6)". The backend's `project-overview.md` carries the six shared edits, byte-identical to the web's (committed in web Private Rooms A, `dc36f25`).
- **History** (2026-11-08): backend `0542a71` (R6b), on `main` and pushed.
  - `GET /profile/history`: every duel entry carries **`isPrivate: boolean`** (required in OpenAPI), `true` for a private room's game. Solo entries have no such field.
  - **Migration** `20261108165917_game_session_is_private`: `game_sessions.is_private BOOLEAN NOT NULL DEFAULT false` (older duels read `false`), and a CHECK that keeps solo runs from being private. Applied to dev and ingest.
  - **Stats unchanged:** a room game counts like any duel. Additive, REST only, no `PROTOCOL_VERSION` bump.
  - **Docs:** OpenAPI; backend `context/api-contract.md` § 4.
- **Differences from this request:** a full room answers `not_found` (the request allowed either); `room:create` is rate-limited too; codes are accepted in any case.
- **Checked from the web** (2026-11-09, web Private Rooms B, 3000 against 8080):
  - A two-browser room game from create to result: the creator got `roomCreated → paired → coinFlip → matchReady`, the joiner `paired → coinFlip → matchReady`, a lowercase code joined, the joiner named first, and both histories show the game as private ("Friend").
  - A wrong code, a full room, a cancelled room and a closed tab all answer `not_found`; the link joins a signed-out friend as a guest; a queue duel still flips with `source: 'coin'`.
  - **Own code in a second tab** never reaches `forbidden`: the tab takes the creator's connection over ("You're connected somewhere else"), which closes the room, so the join answers `not_found`.
  - **Not checked live:** the join and create rate limits (`RATE_LIMITS_ENABLED` is off on the dev backend) and a real creator drop (the browser's offline mode doesn't close an open WebSocket).

### Report in the Built note

- The final command, event and field names, and anything that differs from this request.
- The join rate limit chosen, and who names first.
- The migration name.

### Then

1. **Web, Private Rooms A** (the /play controls, the waiting screen, join errors, the "vs friend" tag, on the mock) needs nothing from here and can ship first.
2. **Web, Private Rooms B** (the real socket commands and events, two-browser checks) needs R6 on the backend's `main`.
3. **Later:** a rematch request (both tap Rematch, the same pair plays again).

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R6. Write it up as a backend feature spec (or two, if you'd split rooms from persistence), the way R4 and R5 were done: `room:create` with the creator's filters, `room:join` with a 6-character code, `room:leave`, `roomCreated` and `roomExpired`, then the existing `paired` → `coinFlip` (new `source: 'room'`) → `matchReady` with no filter window. Rooms are in memory and wait 10 minutes; one migration flags room games, and history gains `isPrivate`. Also apply the `project-overview.md` changes listed in `../lineup-web/context/features/private-rooms-a-mock.md` § Shared spec, so the file stays identical in both repos. Ask me anything unclear before `/feature load`.


---

## R7. A catalog overview for the landing page, with a showcase match

**Why:** the landing page (`/`) feels empty (user, 2026-11-09). It will show what the archive holds (matches, players, clubs, seasons, finals, shootouts), the competitions and the most-played clubs, and a scripted demo turn on one real, famous XI. The design is in `context/docs/landing-page-improvements.md`; the web fixes are `context/fixes/landing-a-sections.md`, `landing-b-demo-turn.md` and `landing-c-wiring.md`.

**Decisions (user, 2026-11-09):**

- **The numbers come from the backend**, so they grow with the pool. No constants in the web.
- **No community activity** (games played, players online). Dataset numbers only.
- **The demo uses Real Madrid's XI from Real Madrid 2–3 Barcelona, La Liga, 23 April 2017** (match slug `2017-04-23-real-madrid-barcelona`, home side). The demo reveals Bale, Cristiano Ronaldo, Benzema, Modrić and Kroos, in that order, and shows one wrong guess: Lionel Messi, who started for Barcelona in the same match.
- **The showcase match leaves the playable pool.** A real XI on a public page is that match's answer key (Hard Constraint 2), so the selector must never serve it, in solo or in a duel.

### The endpoint: `GET /catalog/overview` (no migration)

- **Public**, like `GET /catalog/filter-options` (the landing page renders before any session). Rate-limited as `catalog`. Returns the §2 envelope.
- **Client-agnostic:** mobile's home can read it too. Nothing in it is web-specific.

| Field | Type | Meaning |
| --- | --- | --- |
| `counts.matches` | int | Matches the selector can serve (`MatchSelectorService.candidates()`). The showcase is not one of them |
| `counts.players` | int | Distinct players in those matches' lineups, both sides |
| `counts.clubs` | int | Distinct sides of those matches with `kind = club` |
| `counts.nationalTeams` | int | Distinct sides with `kind = national_team` |
| `counts.seasons` | int | Distinct season start years of those matches |
| `era` | `EraRange` | As `filter-options` returns it |
| `highlights.finals` | int | Those matches with `stage = 'Final'` (the scraper's stage-name curation normalises it) |
| `highlights.shootouts` | int | Those matches with `shootout_home` set |
| `highlights.extraTime` | int | Those matches with `extra_time` true |
| `highlights.goals` | int | Sum of both sides' `goals` over those matches |
| `competitions` | `CompetitionRef[]` | The competitions those matches belong to, with `logoUrl`, sorted by name as `filter-options` sorts them |
| `topClubs` | `ClubRef[]`, at most 12 | `kind = club` only, ordered by number of those matches (most first), then by name |
| `showcase` | `Showcase \| null` | Below |

**`Showcase`:**

| Field | Type | Meaning |
| --- | --- | --- |
| `match` | `MatchInPlay` | The `MatchIdentity` shape (R4) plus `side` and `formation`, as solo uses: here `side: 'home'`, `formation: '4-3-3'` |
| `players` | 11 × `RevealedPlayer` | The named side's whole XI, **with `directoryKey`** (the grid and the demo's suggestion rows key on it) |
| `demo.reveals` | `int[]`, 1–11 distinct slots | The slots the demo reveals, in order. Here Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos |
| `demo.miss` | `{ name, imageUrl, directoryKey } \| null` | The demo's wrong guess. Here Lionel Messi, from the other side's XI |

### Rules

- **The showcase is a backend constant**, for example in `src/catalog/showcase.ts`:
  - `matchSlug: '2017-04-23-real-madrid-barcelona'`, `side: 'home'`
  - `reveals: ['gareth-bale', 'cristiano-ronaldo', 'karim-benzema', 'luka-modric', 'toni-kroos']` (player slugs)
  - `miss: 'lionel-messi'`
- **The selector excludes it.** `poolWhere` in `src/matches/match-selector.service.ts` gains `slug: { notIn: [SHOWCASE.matchSlug] }`. That one change covers solo, duel, rooms, `filter-options`, the empty-pool check and these counts.
- **Checked on every read; never thrown.** If the match isn't loaded, its side's lineup isn't 11, a `reveals` slug isn't in that side's XI, or `miss` isn't in the **other** side's XI, `showcase` is `null`, and a warning is logged. The rest of the response is unaffected.
  - The `miss` check is what keeps the demo honest: the wrong guess really is not in this XI.
- **Hard Constraint 2 holds:** the only XI this endpoint sends is one the selector can never serve.
- **Hard Constraint 20 holds:** no memorability score in any field.
- **Cost:** `filter-options` already runs `candidates()` per request, and this endpoint does the same plus a few aggregates. An in-memory cache (for a few minutes, or until the pool changes) is fine if you measure a need. Not required.

### Contract and versions

- **Additive:** one new REST endpoint and one changed `where` clause. No socket change, no `PROTOCOL_VERSION` bump.
- Document it in OpenAPI (`CatalogOverview`, `Showcase`, `ShowcasePlayer`, `ShowcaseDemo`) and in the backend's `context/api-contract.md`.

### Tests

- **The exclusion:** `candidates()` never returns the showcase match, and `filter-options` coverage doesn't count it.
- **The counts** as a pure function over candidate rows: two matches sharing a player count it once; clubs and national teams are split by `kind`; finals, shootouts, extra time and goals add up.
- **`topClubs`:** clubs only, at most 12, ordered by match count, ties by name.
- **The showcase:** the real constant builds 11 players and 5 reveals with Messi as the miss. A missing match, a `reveals` slug from the wrong side, or a `miss` from the same side each give `showcase: null`, and the rest of the response still returns.
- **The endpoint:** answers without a session, and conforms to its schema.

### Built

- **The endpoint** (2026-11-09): backend `d5cdcb6`, on `main` and pushed.
  - `GET /catalog/overview`, public (no session), the `catalog` rate limit (60 a minute), the usual envelope around `CatalogOverview`.
  - **Fields as requested:** `counts { matches, players, clubs, nationalTeams, seasons }`, `era`, `highlights { finals, shootouts, extraTime, goals }`, `competitions: CompetitionRef[]` by name (as `filter-options`), `topClubs: ClubRef[]` (at most 12, clubs only, most pool matches first, then by name), `showcase: Showcase | null`.
  - **`Showcase`:** `{ match: MatchInPlay, players: RevealedPlayer[11], demo: { reveals: slot[], miss: ShowcasePlayer | null } }`, where `ShowcasePlayer` is `{ name, imageUrl, directoryKey }`. Players carry `directoryKey`, as web Landing A asked.
  - **Checked on every build:** `showcase` is `null` if the match isn't loaded, the XI isn't 11, a slot breaks the formation, a reveal isn't in that XI, or the miss isn't in the other XI. The rest of the response always returns.
  - **The pool excludes the match:** solo, duels, rooms and `filter-options` never serve it.
  - **Docs:** OpenAPI components `CatalogOverview`, `Showcase`, `ShowcaseDemo`, `ShowcasePlayer`; backend `context/api-contract.md` § 4, row 17.
- **Differences from this request:**
  - **A 5-minute server cache** of the built overview: new data shows within 5 minutes. A build takes about 6 s on ingest.
  - **The constant lives in `src/matches/showcase.ts`,** not `src/catalog/`.
  - **The miss's type is named `ShowcasePlayer`** in OpenAPI; the web calls the same shape `ShowcaseMiss`. Same fields.
- **Numbers on dev** (the seed; what the web sees locally):
  - Counts: 10 matches, 167 players, 7 clubs, 4 national teams, 10 seasons. Era 2002–2023.
  - Highlights: 3 finals, 0 shootouts, 0 extra time, 40 goals.
  - Competitions (6): Continental Champions Cup, Continental Nations Championship, Crown League, Federation Trophy, Global Nations Cup, Liga Meridiana.
  - `topClubs` (7): Northgate United, Real Solvara, Atlético Castellmar, FC Weerdam, Kingsmere City, Riverton Athletic, Yıldırımspor.
  - **`showcase: null`:** the match isn't seeded on dev.
- **Numbers on ingest** (the real data):
  - Counts: 1,924 matches, 3,786 players, 53 clubs, 47 national teams, 26 seasons. Era 2000–2025.
  - Highlights: 56 finals, 53 shootouts, 84 extra time, 5,343 goals (the dataset's 5,348 less the showcase's 5).
  - Competitions (11): Bundesliga, Champions League, Euro, LaLiga, Liga Portugal, Ligue 1, Premier League, Serie A, Süper Lig, UEFA Cup / Europa League, World Cup.
  - `topClubs` (12): Manchester United, Arsenal, Chelsea FC, Liverpool FC, Tottenham Hotspur, Manchester City, Real Madrid, Barcelona, AC Milan, Inter, Paris Saint-Germain, Juventus.
  - **The showcase builds:** Real Madrid 2–3 Barcelona, LaLiga Matchday 33, home side, 4-3-3, all 11 players with images. `demo.reveals` is slots `[8, 10, 9, 7, 5]` (Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos); Messi is the miss, with an image.
- **Backend's note, accepted:** the showcase XI is now public, and other 2016–17 Real Madrid matches still in the pool share most of its starters. The demo shows 5 of those names, all famous and public football knowledge; every visitor sees the same page, so duels stay fair (Hard Constraint 15), and no served match's squad is sent (Hard Constraint 2).
- **Checked from the web** (2026-11-10, web Landing C, 3000 against 8080):
  - **The transcription held:** web Landing A's schemas match `d5cdcb6` field for field; no code change. Both the dev and ingest responses parse.
  - **Dev:** every count, highlight, competition and club matches the numbers above; with `showcase: null` the fold's right column stays empty and the text doesn't move.
  - **Ingest:** every number above shows on `/` (1,924 / 3,786 / 100 / 26; 56 / 53 / 84 / 5,343; "Seasons 2000–01 to 2025–26"), the 11 competitions and 12 crests load, and the demo plays "Real Madrid's XI, 23 April 2017": Bale, Cristiano Ronaldo, "Mes" → Lionel Messi ("Not in this XI"), Benzema, Modrić, Kroos, with photos, looping at 25 s.
  - **The pool:** 15 solo offers on LaLiga 2016-17 with Real Madrid gave only the other three matches (Atlético away, Barcelona away, Atlético at home), never the showcase. They left 15 abandoned guest sessions on ingest (no side chosen, so no runs or stats).
  - **Backend down:** `/` shows the fold, rules and modes only; no skeleton left behind, no zeros, no error copy (the three network retries take about 3 s). Started again (on ingest), a reload brings every section and the Real Madrid demo back.

### Report in the Built note

- The final field names, and anything that differs from this request.
- **The real numbers** on the dev database: every count and highlight, and the `topClubs` order. Web Landing C checks the page against them.
- Where the showcase constant lives.

### Then

1. **Web, Landing A and B** (the sections, the numbers and the demo turn, on the mock) need nothing from here and can ship first.
2. **Web, Landing C** (the real endpoint) needs R7 on the backend's `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R7. Write it up as one backend feature spec, the way R5 was done: a public `GET /catalog/overview` with the playable pool's counts, highlights, competitions and top 12 clubs, plus a `showcase`: Real Madrid's XI from `2017-04-23-real-madrid-barcelona` (home side), with the demo's reveal order (Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos) and Lionel Messi as the wrong guess. The showcase is a backend constant, checked on every read (`null` if anything is off), and `poolWhere` must exclude its match so it is never served as a game. No migration, no `PROTOCOL_VERSION` bump. Report the real counts in the Built note. Ask me anything unclear before `/feature load`.

---

## R8. Three more reveals in the landing showcase

**Why:** the landing demo should find eight Real Madrid players, not five (user, 2026-11-10). Web fix: `context/fixes/landing-d-fold-demo.md`.

### The change (no migration, no contract change)

- **The showcase constant** (`LANDING_SHOWCASE` in `src/matches/showcase.ts`, R7) gains three reveals, after Kroos, in this order:
  - `sergio-ramos` (slot 2, DF)
  - `keylor-navas` (slot 0, GK)
  - `marcelo` (slot 4, DF)
- `demo.reveals` becomes `[8, 10, 9, 7, 5, 2, 0, 4]`. The miss (Messi) is unchanged.
- **Nothing else changes:** `ShowcaseDemo.reveals` already allows 1–11 distinct slots, and the build-time checks (each reveal in the named XI) cover the new three.
- **The overview cache** (5 minutes) means the new reveals show within 5 minutes of a deploy.

### Tests

- The real constant builds 8 reveals in that order, with Messi as the miss.
- The existing null cases still hold.

### Built

- **The constant** (2026-11-10): backend `aca22bf`, on `main` and pushed. `LANDING_SHOWCASE` reveals `sergio-ramos`, `keylor-navas` and `marcelo` after `toni-kroos`; the miss is still `lionel-messi`.
- **On ingest** the build returns `demo.reveals = [8, 10, 9, 7, 5, 2, 0, 4]`: Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos, Ramos, Navas, Marcelo (FW, FW, FW, MF, MF, DF, GK, DF). All 11 players and the miss have images, and the showcase match is still out of the pool.
- **Unchanged:** the contract and `PROTOCOL_VERSION`; no migration. A running server shows the new reveals within 5 minutes of a deploy (R7's cache).
- **Differences from this request:** none.
- **Checked from the web** (2026-11-10, web Landing D, 3000 against 8080 on ingest): the demo types "Bal", "Ron", "Mes" ("Not in this XI"), "Ben", "Mod", "Kro", "Ram", "Nav", "Mar" and fills Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos, Ramos, Navas and Marcelo with photos (8/11); no ring; the sentence reads "eight of Real Madrid's starting eleven".

### Report in the Built note

- The commit, and the `demo.reveals` the ingest build returns.

### Then

- **Web, Landing D** plays the eight on real data with no web change; its real-data check waits for this.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R8. It's a small change to R7's showcase constant, `LANDING_SHOWCASE` in `src/matches/showcase.ts`: add `sergio-ramos`, `keylor-navas` and `marcelo` to the reveals, after `toni-kroos`, in that order, so `demo.reveals` becomes `[8, 10, 9, 7, 5, 2, 0, 4]`. Update the showcase tests. No migration, no contract change. Report the commit and the `demo.reveals` the ingest build returns.

---

## R9. The Pro tier and the `PRO_ENABLED` switch

**Why:** five Pro features are coming (user, 2026-11-10), all behind one switch. This request builds the switch and the tier; R10–R14 each gate one feature on it. Overview: `context/docs/pro-features.md`. Web spec: `context/features/pro-a-switch.md`.

**Decisions (user, 2026-11-10):**

- **`PRO_ENABLED=false`** (production at launch): no split. Every user and every guest is Pro.
- **`PRO_ENABLED=true`** (development now, production later): the real split. Build and test with `true`.
- **The backend alone decides** (Hard Constraint 16). The web has no switch of its own; it reads the tier and the switch from here.
- **Guests can be Pro**, and upgrading a guest keeps the tier, as it keeps the history.
- **Payments are out of scope.** Development needs only a way to set a tier by hand.

### The switch

- `PRO_ENABLED: z.stringbool().default(false)` in `src/config/env.schema.ts`. A missing variable means "everyone is Pro", so nobody is ever locked out by a deploy mistake.
- `.env.example` documents both values. Your dev `.env` sets `PRO_ENABLED=true`.

### The stored tier (one migration)

- `users.tier`: a `Tier` enum (`free`, `pro`), `NOT NULL DEFAULT 'free'`. Every existing user and guest reads `free`.
- **Upgrade keeps it:** a guest upgrade keeps the same `users` row (B11), so the tier carries over. Add a test for it anyway.
- **A dev script, not an endpoint:** `npm run user:tier -- <email or handle> <free|pro>` sets one user's stored tier. A guest is found by its `guest-…` handle. No HTTP route can change a tier.

### The effective tier

- **One pure function:** `effectiveTier(stored, proEnabled)` returns `stored` when `proEnabled` is on, and `'pro'` when it's off. Unit tested.
- **Every `User` the API returns carries it:** session, sign-in, sign-up, guest, upgrade and profile. Today `toContractUser` (`src/auth/auth-flow.service.ts`) hard-codes `'free'`.
- **Every gate reads it fresh,** from the `users` row at the time of the request: never from the gateway token or a cached copy. A tier set by the script, or later by a purchase, then applies without signing in again. The socket reads it at each gated command (R10).
- **The solo summary already follows it:** `toSoloSummary(run, user.tier)` sends `missed` to Pro. With the effective tier, everyone gets the list while the switch is off.

### Public config: `GET /config` (no migration)

- **Public**, no session, so the landing page and signed-out visitors can read it. Use the `catalog` rate limit.
- **Response `AppConfig`:** `{ proEnabled: boolean }`, the switch's value. `Cache-Control: public, max-age=300` is fine; the value only changes on a restart.
- **The web uses it** to decide whether any Pro wording, lock or `/pro` page exists. It never uses it to grant anything.

### A reason on `forbidden`

- **`ApiError` gains an optional `reason`:** `'pro_required' | 'daily_cap'`, set only with `forbidden`. It goes in the same §2 envelope on REST and in socket acks.
- `pro_required` is used by R10, R12, R13 and R14, and `daily_cap` by R11. Both are defined now so the contract changes once.
- **Messages stay safe to show,** as every message is (for example "That needs Pro.").

### Contract and versions

- **Additive:** `User.tier` already exists (it becomes real), `AppConfig` and `GET /config` are new, and `reason` is optional.
- **No `PROTOCOL_VERSION` bump.**
- **Docs:** OpenAPI (`AppConfig`, `ApiError.reason`), backend `context/api-contract.md`.

### Shared spec

- **`project-overview.md`:** copy `../lineup-web/context/project-overview.md` over the backend's copy; it must stay identical. The web edited the Free vs Pro table (5 solo runs a day, practice not saved), added the switch paragraph under it, and added the `/archive` and `/pro` routes.

### Tests

- `effectiveTier` with both switch values and both stored tiers.
- **Every session-returning call** reports `pro` for a stored-`free` user with the switch off, and `free` with it on.
- A guest set to `pro` stays `pro` after upgrading.
- `GET /config` with both values, with no session.
- An error envelope with `reason` parses; one without still does.
- The script sets a tier by email and by guest handle, and refuses an unknown user.

### Built

- **The tier and the switch** (2026-11-12): backend `fcf2079`, on `main` and pushed.
  - **Migration** `20261111235103_user_tier`: `users.tier`, enum `free`/`pro`, default `free`. Applied to dev and ingest.
  - **`User.tier` is the effective tier:** the stored tier while `PRO_ENABLED=true`; `pro` for every user and guest while it's `false` (the default when unset). It's on every `User` the backend returns: `/auth/session`, sign-in, sign-up, guest, upgrade and `/profile`.
  - **Read fresh:** from the user row on every request, so a tier change applies without signing in again. A guest keeps its tier when upgrading.
  - **`GET /config`:** public, no session. It returns `{ success: true, data: { proEnabled: boolean } }`, uses the `catalog` rate limit, and sends `Cache-Control: public, max-age=300`.
  - **`ApiError.reason`:** optional, `'pro_required' | 'daily_cap'`, only ever with `code: 'forbidden'`, on REST and in socket acks. Nothing sends it yet; R10–R14 will.
  - **The script:** `npm run user:tier -- <email or handle> pro` in `lineup-backend`. A guest is found by its `guest-…` handle.
  - **No `PROTOCOL_VERSION` bump** (additive).
- **Differences from this request:** none in the contract.
  - **Not changed:** Better Auth's own `GET /api/auth/get-session` shows the stored tier, not the effective one. The web reads `/auth/session` (`src/lib/api/http/api-client.ts`), so nothing changes on the web side.

### Report in the Built note

- The commit(s) and the migration name.
- The script's exact command.
- Anything that differs from this request.

### Then

- **Web, Pro A** (`context/features/pro-a-switch.md`) needs R9 on the backend's `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R9 and `../lineup-web/context/docs/pro-features.md`. Write R9 up as one backend feature spec: a `PRO_ENABLED` env var (stringbool, default `false`), a `users.tier` column (default `free`), a pure `effectiveTier(stored, proEnabled)` used by every `User` the API returns (replacing the hard-coded `'free'` in `toContractUser`), a public `GET /config` returning `{ proEnabled }`, an optional `reason` (`pro_required` | `daily_cap`) on `forbidden` errors, and a dev script `npm run user:tier -- <email or handle> <free|pro>`. Gates read the tier fresh from the database per request. Copy `../lineup-web/context/project-overview.md` over this repo's copy. No `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R9 "Report in the Built note", plus anything that differs from the request.

---

## R10. Pro-only room hosting

**Why:** "Private lobbies: Free join only, Pro host + join" (`project-overview.md` § Free vs Pro). Rooms are built (R6); only the gate is missing. Web spec: `context/features/pro-b-room-hosting.md`. Needs R9.

### The change (no migration)

- **`room:create`:** a user whose effective tier is `free` gets `forbidden`, `reason: 'pro_required'`, message "Hosting a room needs Pro. Anyone can join one." Check it right after payload validation, before the queue and hosting checks.
- **Read the tier fresh** from the `users` row at the command (R9). The gateway token's claims are not enough.
- **`room:join` is unchanged:** a Free player can join a Pro player's room, and the duel inside is identical for both (Hard Constraint 15).
- **An open room stays open** if its host's tier drops while it waits. It is used or expires as usual.
- **With `PRO_ENABLED=false`** everyone is Pro, so nothing changes for anyone.

### Tests

- With the switch on, a Free `room:create` gets the refusal with its reason, and nothing is stored. A Pro one opens a room.
- With the switch off, a stored-`free` user opens a room.
- **Two-client harness:** a Pro creator and a Free joiner play a room game to `finished`.

### Built

- **The gate** (2026-11-12): backend `d7d53ca`, on `main` and pushed.
  - **`room:create` refuses Free while `PRO_ENABLED=true`.** The ack is `{ success: false, error: { code: 'forbidden', message: 'Hosting a room needs Pro. Anyone can join one.', retryAfterMs: null, reason: 'pro_required' } }`. Nothing is stored and no `roomCreated` follows.
  - **It's the first check on `room:create`,** so it wins over the other refusals ("You already have a room open.", queued, in a duel) and over `empty_pool`.
  - **The tier is read from the database at each `room:create`:** a tier set with `npm run user:tier -- <handle> pro` applies on the next attempt, with no reconnect or new sign-in.
  - **`room:join` is unchanged:** a Free player can join a Pro player's room, and the duel is identical for both.
  - **An open room stays open** if its host drops to Free while it waits.
  - **With `PRO_ENABLED=false`** everyone can host, as before.
  - No contract shape change (`reason` exists since R9), no migration, no `PROTOCOL_VERSION` bump.
- **Differences from this request:** the tier check runs first on `room:create`; the request placed it right after payload validation. For the web the outcome is the same: a Free player's create always answers `pro_required`.

### Report in the Built note

- The commit and the exact message.
- Where the check sits among the existing `forbidden` checks.

### Then

- **Web, Pro B** needs R10 on `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R10. Gate `room:create` on the effective tier from R9: Free gets `forbidden` with `reason: 'pro_required'` and the message "Hosting a room needs Pro. Anyone can join one.", read fresh from the database at the command. `room:join` is unchanged, and an open room survives its host dropping to Free. Tests as listed, including a Pro creator and a Free joiner in the two-client harness. No migration, no `PROTOCOL_VERSION` bump. When it's merged to `main` and pushed, give me everything listed in § R10 "Report in the Built note", plus anything that differs from the request.

---

## R11. The solo daily cap

**Why:** Free plays 5 solo runs a day; Pro is unlimited (user, 2026-11-10). Duels are never capped (`monetization.md` § Rejected). Web spec: `context/features/pro-c-solo-cap.md`. Needs R9.

**Decisions (user, 2026-11-10):**

- **5 runs a day,** resetting at **UTC midnight** for everyone. The client never sends a time zone.
- **A run counts when its side is picked** (`POST /solo/sessions/:id/side` accepted). Taking an offer and leaving it doesn't count. Quitting later doesn't give the run back.
- **Practice runs (R14) never count.**

### Rules

- A constant `SOLO_DAILY_RUNS = 5`, applied only when the effective tier is `free`.
- **What counts:** the user's solo runs whose side was picked since the last UTC midnight, **including a run still in play**. Today a run may only be written to `game_sessions` when it ends; count the open in-memory run too, or write the row at side pick. Your choice; document it.
- **`POST /solo/sessions`:** at 5 used, refused with `forbidden`, `reason: 'daily_cap'`, `retryAfterMs` = the milliseconds to the next UTC midnight, and the message "You've played your 5 solo runs today. Duels are unlimited."
- **`POST /solo/sessions/:id/side`:** checks again and counts in one step, so two tabs can't both take the fifth run. It refuses the same way.
- **The clock is injected** (the existing `CLOCK`), so the reset is testable.

### New: `GET /solo/allowance` (session required)

- **Response `SoloAllowance`:** `{ limit: number | null, used: number, resetsAt: epoch ms }`.
  - `limit` is `5` for Free and `null` for unlimited (Pro, or the switch off).
  - `used` counts as above, for every tier.
  - `resetsAt` is the next UTC midnight.
- The web shows "N of 5 solo runs left today" from this, and never counts on its own.

### Contract and versions

- Additive: one new call, one new type, and `reason: 'daily_cap'` (defined in R9). No `PROTOCOL_VERSION` bump.

### Tests

- Free: five side picks, then the sixth start is refused with `daily_cap` and the right `retryAfterMs`.
- After UTC midnight (moved clock), Free can start again.
- Pro, and any user with the switch off, are never refused.
- An offer with no side pick doesn't count; a quit run does.
- Two concurrent side picks at 4 used: exactly one succeeds.
- `GET /solo/allowance` for Free, Pro and the switch off.

### Built

- **The cap** (2026-11-12): backend `35f1ce3`, on `main` and pushed.
  - **Counted in memory plus saved runs:** open in-memory runs whose side was picked, plus today's saved `game_sessions`. Nothing is written at side pick, so a run lost to a server restart isn't counted.
  - **The refusal, on both `POST /solo/sessions` and the side pick:** `{ success: false, error: { code: 'forbidden', message: "You've played your 5 solo runs today. Duels are unlimited.", retryAfterMs: <ms to the next UTC midnight>, reason: 'daily_cap' } }`.
  - **The start refuses before anything else,** so it wins over `empty_pool`. A run in play keeps going.
  - **The side pick counts and claims in one step:** two tabs can't both take the fifth run.
  - **`retryAfterMs` now also comes with `daily_cap`,** not only `rate_limited`. The web's `ApiError` already allows it.
  - **`GET /solo/allowance`:** any session, guests included; 401 without one. `{ limit: number | null, used: number, resetsAt: epoch ms }`; `limit` is 5 for Free and `null` when unlimited; `used` counts for every tier.
  - No migration, no `PROTOCOL_VERSION` bump.
- **Differences from this request:** none for the web. The in-memory choice means a restart forgives an open run.

### Report in the Built note

- The commit, and whether runs are written at side pick or counted in memory.
- The exact message.

### Then

- **Web, Pro C** needs R11 on `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R11. Add a solo daily cap for Free users (effective tier from R9): 5 runs per UTC day, counted when a side is picked (including a run in play), never for Pro or with `PRO_ENABLED=false`. `POST /solo/sessions` and the side pick refuse past the cap with `forbidden`, `reason: 'daily_cap'`, and `retryAfterMs` to the next UTC midnight; the side pick counts atomically. Add `GET /solo/allowance` returning `{ limit, used, resetsAt }` (`limit` null when unlimited). Practice runs (R14, later) never count. Tests as listed. No `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R11 "Report in the Built note", plus anything that differs from the request.

---

## R12. Archive browse and search

**Why:** Pro browses and searches every match in the game; it is also the way into exact match selection (R13). Web spec: `context/features/pro-d-archive.md`. Needs R9.

### The endpoint: `GET /catalog/matches` (no migration)

- **Who:** with `PRO_ENABLED=true`, a session with the effective tier `pro`. Free gets `forbidden`, `reason: 'pro_required'`; no session gets `unauthorized`. With the switch off it is **public**, like the rest of the catalog.
- **Query:** all optional.

  | Param | Rule |
  | --- | --- |
  | `q` | Trimmed text, 1–64 characters |
  | `competitionId` | One competition id |
  | `clubId` | One club id, on either side |
  | `from`, `to` | Season starts, inside the covered era, `from ≤ to` |
  | `cursor` | From the previous page |
  | `limit` | 1–50, default 20 |

- **Response `ArchivePage`:** `{ entries: MatchIdentity[], nextCursor: string | null, total: number }`. `total` counts every match the query matches.
- **The pool only:** the playable pool (both gates), with the landing showcase excluded through the same `poolWhere`. Every entry is a match R13 accepts.
- **Order:** newest first by date, then by id. Never by `memorability_score` (Hard Constraint 20).
- **Search:** `q` matches club names, short names and club aliases, the competition name, the match nickname and the season. Use the same normalization as guesses (`normalizeName`: diacritics, Turkish letters, case). **Every word must match** somewhere, so "milan 2005" and "istanbul" both work.
- **Never in the response:** lineups, players, sides or formations (Hard Constraint 2), and no memorability score (Hard Constraint 20). `MatchIdentity` is already safe; send nothing more.
- **Rate limit:** `catalog`.
- **Performance:** about 1,900 matches today. Searching the selector's in-memory candidates is fine, or a query with an index; your choice, report it.

### Contract and versions

- Additive: one new call and one new type. No `PROTOCOL_VERSION` bump.

### Tests

- The access rules for Free, Pro, no session, and the switch off.
- Each filter on its own and combined; `from`/`to` bounds.
- `q`: diacritics ("atletico" finds Atlético), Turkish letters, several words, a nickname.
- Order, cursor paging with no repeats or gaps, `total`.
- The showcase match never appears; nothing outside the pool appears.

### Report in the Built note

- The commit, how search is done (memory or SQL), and a sample response time on ingest.

### Then

- **Web, Pro D** needs R12 on `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R12. Add `GET /catalog/matches`: a paged, searchable list of the playable pool (showcase excluded) as `MatchIdentity` entries, newest first, with `q`, `competitionId`, `clubId`, `from`, `to`, `cursor` and `limit`, returning `{ entries, nextCursor, total }`. Search normalizes like guesses and needs every word to match. With `PRO_ENABLED=true` it needs a Pro session (Free gets `forbidden` + `reason: 'pro_required'`); with the switch off it's public. No lineups, players or memorability scores. Tests as listed. No migration, no `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R12 "Report in the Built note", plus anything that differs from the request.

---

## R13. Exact match selection

**Why:** Pro picks the exact match to play: "I want to play Istanbul 2005 right now" (`monetization.md`). The match comes from the archive (R12). Web spec: `context/features/pro-e-exact-match.md`. Needs R9 and R12.

### The change: `POST /solo/sessions` takes a `matchId` (no migration)

- **The request body becomes `SoloStartRequest`:** today's `Filters` plus an optional `matchId`. The web keeps sending filters, so the body stays valid for an older server. When `matchId` is present, the filters are ignored.
- **Pro only:** a Free user with `matchId` gets `forbidden`, `reason: 'pro_required'`.
- **The match must be in the pool:** unknown, not playable, or the showcase → `not_found`, "That match isn't in the game."
- **Everything after is today's solo run:** the same `SoloMatchOffer`, the player picks the side, and the run counts in history and stats like any other.
- **Replays are allowed:** a match can be picked again any number of times.
- **Solo only:** the queue and rooms never take a `matchId`. A Pro-only duel pool is rejected (`monetization.md`).
- **Practice:** R14 adds `practice` to the same body; the two combine.

### Contract and versions

- Additive: an optional field on the start body. No `PROTOCOL_VERSION` bump.

### Tests

- Pro with a pool match gets that exact match offered, whatever the filters say.
- Free with `matchId` is refused with the reason; Free without it is unchanged.
- An unknown id, a match outside the pool and the showcase match are `not_found`.
- With the switch off, any user can pick a match.
- The run counts in stats and history.

### Report in the Built note

- The commit and the final body shape.

### Then

- **Web, Pro E** needs R13 on `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R13. Let `POST /solo/sessions` take an optional `matchId` alongside the filters (ignored when it's set): Pro only (`forbidden` + `reason: 'pro_required'` for Free), the match must be in the playable pool (`not_found` otherwise, the showcase included), and everything after is today's solo run, counted in stats. Replays are allowed; duels never take a `matchId`. Tests as listed. No migration, no `PROTOCOL_VERSION` bump. When it's merged to `main` and pushed, give me everything listed in § R13 "Report in the Built note", plus anything that differs from the request.

---

## R14. Practice mode

**Why:** Pro can practise a match with no lives and no clock (user, 2026-11-10). Web spec: `context/features/pro-f-practice.md`. Needs R9 (and R13, to combine with a picked match).

**Decisions (user, 2026-11-10):**

- **No lives, no 15-second clock.** The run ends when all 11 are named or the player quits.
- **Not saved at all:** no `game_sessions` row, no rounds or guesses, no history, no stats, and it never counts toward the daily cap (R11).

### The change (no migration)

- **The start body** (`SoloStartRequest`, R13) gains an optional `practice: boolean`. It combines with `matchId`. Pro only: a Free user gets `forbidden`, `reason: 'pro_required'`.
- **The rules stay in `src/game/`** (Hard Constraint 7). A practice game has no round clock and never loses a life. Every guess is still validated on the server, with today's matching, collisions and rate limit.
- **Endings:** `perfect_clear` (all 11) or `quit`. Never `lives_out`.
- **`SoloSession` gains `practice: boolean`** (always sent). In practice, `round` is always `null` and `lives` stays `3`.
- **`SoloSummary` gains `practice: boolean`.** `livesRemaining` is `3`, `missed` follows the tier as today (always Pro here), and `roundTimesMs` measures the time between finds.
- **Idle runs end:** a practice run with no guess for 30 minutes is dropped from memory. A later call on it answers as an ended run does today. Report the value.

### Contract and versions

- Additive: one optional request field and two response fields. No `PROTOCOL_VERSION` bump.

### Tests

- Rules engine: no expiry however much time passes; 11 finds → `perfect_clear`; quit; no life lost.
- A practice run writes nothing to the database, and stats and history are unchanged after it.
- It doesn't count toward the cap, even for a Free user with the switch off.
- Free with `practice` is refused; with the switch off anyone can practise.
- `practice` with `matchId` plays that match.
- The idle drop.

### Report in the Built note

- The commit, the idle timeout, and what a call on a dropped run answers.

### Then

- **Web, Pro F** needs R14 on `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R14. Add practice mode to solo: an optional `practice: boolean` on the start body (combines with R13's `matchId`; Pro only, `forbidden` + `reason: 'pro_required'` for Free). The rules engine runs it with no round clock and no life loss, ending on all 11 or quit; guesses are validated as usual. `SoloSession` and `SoloSummary` gain `practice: boolean`; `round` stays null and `lives` 3. A practice run is never saved (no rows, no history, no stats) and never counts toward the daily cap. Drop idle practice runs after 30 minutes. Tests as listed. No migration, no `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R14 "Report in the Built note", plus anything that differs from the request.
