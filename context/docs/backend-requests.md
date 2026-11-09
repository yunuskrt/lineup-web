# Backend Requests — from lineup-web

Contract changes the web client needs. The backend owns the contract (`coding-standards.md` § The Contract), so each one is a **backend feature first**, merged and running before the web transcribes it. The scraper keeps its own list in `lineup-scraper/context/docs/backend-requests.md`; numbers continue that sequence.

| # | Request | Needed by | Asked | Status |
| --- | --- | --- | --- | --- |
| R3 | Filter options per competition, and competition logos | Web fixes Match Filters A and B | 2026-11-04 | **Done**: Part 1 (2026-11-04, backend R3a), Part 2 (2026-11-05, backend R3b) |
| R4 | The match on the solo offer, and the order and time of each named player | Web fixes Gameplay Visuals B and C | 2026-11-06 | **Done**: Part 1 (2026-11-06, backend R4a), Part 2 (2026-11-06, backend R4b) |
| R5 | A player directory for guess suggestions | Web features Guess Suggestions A and B | 2026-11-06 | **Done** (2026-11-08, backend R5): an opaque `key`, not `players.id` |
| R6 | Private rooms: create a room, join it with a code | Web features Private Rooms A and B | 2026-11-08 | **Done** (2026-11-08): rooms (backend R6a), history `isPrivate` (backend R6b) |
| R7 | A catalog overview for the landing page, with a showcase match | Web fixes Landing A, B and C | 2026-11-09 | Open |

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
| `players` | 11 × `{ id, name, slot, position, imageUrl }` | The named side's whole XI, as `RevealedPlayer` without `directoryKey` |
| `demo.reveals` | `int[]`, 1–11 distinct slots | The slots the demo reveals, in order. Here Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos |
| `demo.miss` | `{ name, imageUrl } \| null` | The demo's wrong guess. Here Lionel Messi, from the other side's XI |

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

### Report in the Built note

- The final field names, and anything that differs from this request.
- **The real numbers** on the dev database: every count and highlight, and the `topClubs` order. Web Landing C checks the page against them.
- Where the showcase constant lives.

### Then

1. **Web, Landing A and B** (the sections, the numbers and the demo turn, on the mock) need nothing from here and can ship first.
2. **Web, Landing C** (the real endpoint) needs R7 on the backend's `main`.

### Prompt for the backend session

> Read `../lineup-web/context/docs/backend-requests.md` § R7. Write it up as one backend feature spec, the way R5 was done: a public `GET /catalog/overview` with the playable pool's counts, highlights, competitions and top 12 clubs, plus a `showcase`: Real Madrid's XI from `2017-04-23-real-madrid-barcelona` (home side), with the demo's reveal order (Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos) and Lionel Messi as the wrong guess. The showcase is a backend constant, checked on every read (`null` if anything is off), and `poolWhere` must exclude its match so it is never served as a game. No migration, no `PROTOCOL_VERSION` bump. Report the real counts in the Built note. Ask me anything unclear before `/feature load`.
