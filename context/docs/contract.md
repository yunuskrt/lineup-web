# API Contract — as the web client expects it

A plain-text transcription of what `lineup-web` sends and expects today, taken from `src/lib/api/schemas/`, `src/lib/api/client.ts` and `src/lib/api/duel-client.ts`.

**Use it as the starting point for B03.** Once the backend defines the contract in OpenAPI, the backend is right and this file is history. REST paths and socket event names are **suggestions**: the web client only knows method names, so the backend chooses the final routes. Field names, types and rules are what the web actually validates.

---

## 1. Conventions

| Rule | Detail |
| --- | --- |
| Ids | Non-empty strings. Format is the backend's choice. |
| Timestamps in a round | Epoch milliseconds (integer, ≥ 0), from the **server** clock. |
| `playedAt` | ISO 8601 datetime string. |
| Match `date` | ISO date, `YYYY-MM-DD`. |
| Nullable vs optional | `T \| null` means the field is always present. `optional` means it may be absent. |
| Squad size | 11. Lists of players are at most 11 long. |
| Lives | Integer 0–3. |

---

## 2. Result envelope

**Every** REST response, and every socket ack, uses one of two shapes:

| Shape | Fields |
| --- | --- |
| Success | `success: true`, `data: <payload>` |
| Failure | `success: false`, `error: ApiError` |

`ApiError`:

| Field | Type | Rule |
| --- | --- | --- |
| `code` | `ApiErrorCode` | See below |
| `message` | string | Non-empty, safe to show the player. No stack traces, SQL or provider text. |
| `retryAfterMs` | integer ≥ 0, or `null` | Set with `rate_limited`; `null` otherwise. |
| `emptyBecause` | `EmptyPoolReason`, optional | Present **only** with `empty_pool`. |

### Error codes (`ApiErrorCode`)

| Code | Meaning |
| --- | --- |
| `unauthorized` | No session, or bad credentials |
| `forbidden` | Not allowed right now (wrong turn, already registered, run not over yet…) |
| `not_found` | Session or resource doesn't exist |
| `invalid_input` | Request failed validation, or the handle is taken |
| `empty_pool` | No match fits the filters. Comes with `emptyBecause`. |
| `rate_limited` | Too many guesses. Comes with `retryAfterMs`. |
| `session_over` | The run or duel has finished, or the round already ended |
| `network` | **Client-only.** The web app sets it when the request fails; the server never sends it. |
| `server_error` | Anything unexpected |
| `protocol_refused` | Client build older than the server accepts (socket handshake) |

### `EmptyPoolReason`

`competition` · `club` · `era` · `combination`. The first one names the single filter whose removal would refill the pool; `combination` means no single filter is to blame.

---

## 3. Shared types

### Enums

| Type | Values |
| --- | --- |
| `Side` | `home`, `away` |
| `CompetitionKind` | `league`, `ucl`, `uel`, `world_cup`, `euro` |
| `PositionGroup` | `GK`, `DF`, `MF`, `FW` |
| `Tier` | `free`, `pro` |
| `SoloSessionStatus` | `active`, `over` |
| `SoloEndReason` | `lives_out`, `quit`, `perfect_clear` |
| `DuelOutcome` | `win`, `loss`, `draw`, `forfeit_win` |
| `DuelActor` | `you`, `opponent`. **Relative to the receiving client.** |
| `ConnectionStatus` | `connected`, `reconnecting`, `forfeited` |
| `FilterSubmissionStatus` | `pending`, `submitted` |

### `imageUrl` rule (used by `crestUrl` and `imageUrl`)

| Accepted | Rejected |
| --- | --- |
| Absolute `http://` or `https://` URL | `//host/…` (protocol-relative) |
| Root-relative path with **one** leading slash and no spaces, `?` or `#` (e.g. `/mock/crests/x.svg`) | `data:`, `javascript:`, `ftp:` and any other scheme |
| | Bare relative paths (`mock/x.svg`, `./x.svg`), `/` alone, empty string |

**The backend should always send absolute CDN URLs.** The root-relative branch exists only for the web mock's own assets, and the web will tighten it at W27.

### `ClubRef`

| Field | Type | Rule |
| --- | --- | --- |
| `id` | id | |
| `name` | string | Non-empty |
| `shortName` | string | Non-empty. Shown on phones; 3-letter codes work best (`YLD`). |
| `crestUrl` | imageUrl or `null` | |

### `CompetitionRef`

| Field | Type |
| --- | --- |
| `id` | id |
| `kind` | `CompetitionKind` |
| `name` | non-empty string |
| `logoUrl` | imageUrl or `null`, always sent (backend R3b). Renders on the competition filter chips and the game header's second line; `null` shows the kind icon |

### `MatchIdentity`

| Field | Type | Rule |
| --- | --- | --- |
| `id` | id | |
| `competition` | `CompetitionRef` | |
| `season` | string | `YYYY-YY` for leagues and club cups (`2004-05`), `YYYY` for tournaments (`2006`) |
| `date` | ISO date | |
| `stage` | string or `null` | e.g. `Final`, `Matchday 19` |
| `home` | `ClubRef` | |
| `away` | `ClubRef` | |
| `score` | `{ home, away }` | Integers ≥ 0 |
| `nickname` | string or `null` | e.g. `The Rain Final` |

### `MatchInPlay` (the match during a solo run or a duel)

Every `MatchIdentity` field, **plus**:

| Field | Type | Rule |
| --- | --- | --- |
| `side` | `Side` | The XI being named. The named club is `match[side]`. |
| `formation` | string | Digits 1–9 joined by `-`, 3–5 lines, outfield total 10 (e.g. `4-4-2`, `4-1-2-1-2`) |

**The full match is shown during play**: both clubs, the score, the competition and the date. It **never** includes a player of either XI.

### `RevealedPlayer`

| Field | Type | Rule |
| --- | --- | --- |
| `id` | id | |
| `name` | string | Non-empty, display form (`Oğuzhan Şimşek`) |
| `slot` | integer 0–10 | 0 is the goalkeeper; then the lines from defence to attack, filling right to left |
| `position` | `PositionGroup` | Must match the slot in the formation |
| `imageUrl` | imageUrl or `null` | |
| `directoryKey` | directory key | The player's `DirectoryPlayer.key` (backend R5). Marks named players in the guess suggestions. **Never compare `id` with a directory entry** |

`DuelFoundPlayer` = `RevealedPlayer` + `foundBy: DuelActor`. `directoryKey` rides on every shape built from `RevealedPlayer`: found, missed, named, duel found and the socket payloads.

### `RoundTiming`

| Field | Type | Rule |
| --- | --- | --- |
| `startedAt` | epoch ms | Server clock |
| `endsAt` | epoch ms | Must be greater than `startedAt` (15 000 ms later at launch) |

The client draws its countdown from these. It **never decides** an expiry; at 0 it asks the server.

### `GuessResult` (discriminated by `outcome`)

| `outcome` | Other fields |
| --- | --- |
| `correct_new` | `player: RevealedPlayer` |
| `already_found` | `playerId: id` |
| `not_in_xi` | none. **Unrecognised input and real-but-wrong players look identical.** |

### `Filters`

| Field | Type | Rule |
| --- | --- | --- |
| `competitionIds` | id[] | Empty means all |
| `clubIds` | id[] | Empty means all |
| `era` | `{ from, to }` | Season-start years, integers 2000–2025, `from ≤ to` |

### `User` and `Session`

| `User` field | Type | Rule |
| --- | --- | --- |
| `id` | id | |
| `handle` | string | Non-empty |
| `isGuest` | boolean | |
| `tier` | `Tier` | **Resolved by the server.** The client never asserts it. |

`Session` = `{ user: User }`.

---

## 4. REST calls

Paths are suggestions. Every response body is the envelope from §2, wrapping the **Response** type.

| # | Web method | Method and path | Request | Response |
| --- | --- | --- | --- | --- |
| 1 | `auth.getSession` | `GET /auth/session` | — | `Session` or `null` |
| 2 | `auth.signIn` | `POST /auth/sign-in` | `SignInRequest` | `Session` |
| 3 | `auth.signUp` | `POST /auth/sign-up` | `SignUpRequest` | `Session` |
| 4 | `auth.continueAsGuest` | `POST /auth/guest` | — | `Session` (guest) |
| 5 | `auth.upgradeGuest` | `POST /auth/upgrade` | `UpgradeGuestRequest` | `Session` (same user id, `isGuest: false`) |
| 6 | `auth.signOut` | `POST /auth/sign-out` | — | none (`data` empty) |
| 7 | `catalog.getFilterOptions` | `GET /catalog/filter-options` | — | `FilterOptions` |
| 8 | `catalog.getPlayerDirectory` | `GET /catalog/players` | — | `PlayerDirectory` |
| 8a | `catalog.getOverview` | `GET /catalog/overview` | — | `CatalogOverview` (backend R7, not built yet) |
| 9 | `solo.findMatch` | `POST /solo/sessions` | `Filters` | `SoloMatchOffer` |
| 10 | `solo.chooseSide` | `POST /solo/sessions/:sessionId/side` | `{ side: Side }` | `SoloSession` |
| 11 | `solo.guess` | `POST /solo/sessions/:sessionId/guesses` | `SoloGuessRequest` | `SoloGuessResponse` |
| 12 | `solo.syncSession` | `GET /solo/sessions/:sessionId` | — | `SoloSession` |
| 13 | `solo.quit` | `POST /solo/sessions/:sessionId/quit` | — | `SoloSummary` |
| 14 | `solo.getSummary` | `GET /solo/sessions/:sessionId/summary` | — | `SoloSummary` |
| 15 | `profile.getProfile` | `GET /profile` | — | `Profile` |
| 16 | `profile.getHistory` | `GET /profile/history?cursor=&limit=` | `HistoryQuery` | `HistoryPage` |

Better Auth (B10) mounts its own routes. Calls 1–6 may map onto them rather than onto these paths; the web only needs the shapes.

### Request types

| Type | Fields |
| --- | --- |
| `SignInRequest` | `email` (valid email), `password` (8–128 chars) |
| `SignUpRequest` | `email`, `password` (8–128), `handle` (trimmed, 3–24 chars) |
| `UpgradeGuestRequest` | same as `SignUpRequest` |
| `SoloGuessRequest` | `sessionId` (id), `guess` (trimmed, 1–64 chars) |
| `HistoryQuery` | `cursor` (id or `null`), `limit` (integer 1–50; web default 20) |

The web only checks password **length**. The backend owns the password policy.

### Response types

**`FilterOptions`**

| Field | Type |
| --- | --- |
| `competitions` | `CompetitionOption[]`, by name |
| `clubs` | `ClubRef[]`, by name: every pool club |
| `era` | `{ from, to }`, the covered season range |

**`CompetitionOption`** (backend R3a). The pool's view of one competition, so the club and era pickers can narrow to it.

| Field | Type | Rule |
| --- | --- | --- |
| …every `CompetitionRef` field | | |
| `clubIds` | id[] | Pool clubs with at least one pool match in it. Each is in `clubs`, in the same order |
| `seasonStarts` | integer[] | Season starts of its pool matches. Ascending, no repeats, never empty, each inside `era` |

The `Filters` request is unchanged. The web sends at most one competition id; the backend accepts any number.

**`PlayerDirectory`** (backend R5). `{ players: DirectoryPlayer[] }`: **every** player with at least one alias, sorted by `key`, never scoped to a match, filter or session (Hard Constraint 2). Fetched once per match for the guess suggestions; typing never sends a request.

**`DirectoryPlayer`**

| Field | Type | Rule |
| --- | --- | --- |
| `key` | directory key | 22 base64url characters, opaque and stable. **Not** `players.id`: ids sort by creation, so one revealed id would point at its teammates |
| `name` | string | Display form, diacritics kept |
| `imageUrl` | imageUrl or `null` | |
| `terms` | string[] | Normalised aliases, distinct, sorted, at least one. Searched, never shown |

- Any session, guests included; no session gets `unauthorized`. The `catalog` rate limit, 60 a minute.
- Strong `ETag` and `Cache-Control: private, no-cache`; `If-None-Match` with the current tag gets 304 with no body. Brotli or gzip.
- **The web revalidates it, and nothing else** (Guess Suggestions B): this call alone is sent with `cache: 'no-cache'`, every other call with `no-store`. The browser keeps the 200 and its `ETag`, sends `If-None-Match` itself, and hands a 304 back as the cached body. One check per new match; the web has no ETag code of its own.

**`CatalogOverview`** (backend R7, transcribed ahead of it by web Landing A). What the landing page shows. Public, like `filter-options`.

| Field | Type | Rule |
| --- | --- | --- |
| `counts` | `{ matches, players, clubs, nationalTeams, seasons }` | Non-negative integers over the **playable pool only** (the selector's candidates; never the showcase) |
| `era` | `{ from, to }` | As `FilterOptions.era` |
| `highlights` | `{ finals, shootouts, extraTime, goals }` | Non-negative integers over the same matches |
| `competitions` | `CompetitionRef[]` | The pool's competitions; the web orders them as `/play` groups them |
| `topClubs` | `ClubRef[]`, at most 12 | Clubs only (no national teams), most playable matches first, then by name |
| `showcase` | `Showcase` or `null` | `null` when the backend's constant no longer fits the data |

**`Showcase`.** One famous XI for the landing demo. **Its match is excluded from the pool**, so sending its XI breaks no Hard Constraint 2.

| Field | Type | Rule |
| --- | --- | --- |
| `match` | `MatchInPlay` | The whole match, plus the named `side` and its `formation` |
| `players` | `RevealedPlayer[]` | Exactly 11, one per slot, `directoryKey` included |
| `demo.reveals` | integer[] | 1–11 distinct slots of `players`, in the order the demo names them |
| `demo.miss` | `{ name, imageUrl, directoryKey }` or `null` | The demo's wrong guess: a player from the **other** side's XI, so "Not in this XI" is true |

- Any failure (until R7 exists, every call) means the landing page leaves out the numbers, the competitions and the showcase. No error copy.

**`SoloMatchOffer`.** The run is created and the player picks a side next.

| Field | Type |
| --- | --- |
| `sessionId` | id |
| `match` | `MatchIdentity`. Required since backend R4a: the offered match, with no player in it. The side-pick card reads only this |
| `home` | `ClubRef`. Deprecated by the backend; equals `match.home` |
| `away` | `ClubRef`. Deprecated by the backend; equals `match.away` |

**`SoloSession`**

| Field | Type | Rule |
| --- | --- | --- |
| `sessionId` | id | |
| `status` | `SoloSessionStatus` | |
| `match` | `MatchInPlay` | |
| `lives` | 0–3 | |
| `found` | `RevealedPlayer[]` | ≤ 11 |
| `round` | `RoundTiming` or `null` | `null` once the run is over |

**`SoloGuessResponse`**

| Field | Type |
| --- | --- |
| `result` | `GuessResult` |
| `session` | `SoloSession` (state after the guess) |

**`SoloSummary`**

| Field | Type | Rule |
| --- | --- | --- |
| `match` | `MatchIdentity` | |
| `found` | `NamedPlayer[]` | ≤ 11, sorted by `order`. Required since backend R4b |
| `missedCount` | integer 0–11 | |
| `missed` | `RevealedPlayer[]` or `null` | **Pro gets the list, free gets `null`.** The server decides. The web shows it on the pitch only after the player taps Reveal the full XI; `null` shows that button locked |
| `livesRemaining` | 0–3 | |
| `endReason` | `SoloEndReason` | |
| `accuracy` | 0–1 | Correct guesses ÷ all guesses. Parsed, not shown since Gameplay Visuals C |
| `bestStreak` | integer 0–11 | Parsed, not shown since Gameplay Visuals C |
| `roundTimesMs` | integer ≥ 0, array | Time per round. Parsed, not shown since Gameplay Visuals C |

**`NamedPlayer`** = `RevealedPlayer` + the fields below. Only in end-of-game lists: `SoloSummary.found` and, with `foundBy`, `DuelResult.found` (`DuelNamedPlayer`). The live `found` payloads stay `RevealedPlayer` / `DuelFoundPlayer`.

| Field | Type | Rule |
| --- | --- | --- |
| `order` | integer 1–11 | When it was named; 1 is first, no gaps |
| `elapsedMs` | integer 0–15000 | The server's receipt of the correct guess minus its round's start, capped at 15000 (a grace-window guess reads 15000). In a duel, the finder's own turn |

**`Profile`** = `{ user: User, stats: UserStats }`

| `UserStats` field | Type |
| --- | --- |
| `played`, `wins`, `losses`, `draws` | integer ≥ 0 |
| `accuracy` | 0–1 |
| `bestStreak`, `perfectClears` | integer ≥ 0 |
| `favouriteClub` | `ClubRef` or `null` |

**`HistoryPage`** = `{ entries: HistoryEntry[], nextCursor: id | null }`

`HistoryEntry` (discriminated by `mode`):

| Field | Type |
| --- | --- |
| `id` | id |
| `playedAt` | ISO datetime |
| `match` | `MatchIdentity` |
| `foundCount` | integer 0–11 |
| `livesRemaining` | 0–3 |
| `mode` | `solo` or `duel` |
| `outcome` | `SoloEndReason` when `mode: solo`; `DuelOutcome` when `mode: duel` |
| `isPrivate` | boolean, `mode: duel` only, always sent: a private room's game (R6b). The web shows the row as "Friend" |

### Errors the web handles, per call

| Call | Codes |
| --- | --- |
| `signIn` | `invalid_input` (bad form), `unauthorized` (wrong credentials) |
| `signUp` | `invalid_input` (bad form, or **handle taken**) |
| `upgradeGuest` | `invalid_input` (bad form, handle taken), `unauthorized` (no session), `forbidden` (already registered) |
| `findMatch` | `unauthorized`, `invalid_input`, `empty_pool` + `emptyBecause` |
| `chooseSide` | `not_found`, `forbidden` (side already chosen) |
| `guess` | `invalid_input`, `not_found`, `session_over` (run over, or round already ended), `rate_limited` + `retryAfterMs` |
| `syncSession`, `quit` | `not_found`, `invalid_input` (no side chosen yet) |
| `getSummary` | `not_found`, `invalid_input`, `forbidden` (run still in progress) |
| `getProfile`, `getHistory` | `unauthorized`; `getHistory` also `invalid_input` |
| `getPlayerDirectory` | `unauthorized` (session lost), `rate_limited`. Any failure means no suggestions; the game is unaffected |
| `getOverview` | `rate_limited`. Any failure leaves the landing page's data sections out |
| Any | `server_error` |

### Solo behaviour the web relies on

- **Guess handling:**
  - A `correct_new` guess starts the next round immediately; the new `round` is in `session`.
  - `already_found` and `not_in_xi` leave the round running. There's no penalty and no new round.
- **Expiry:** when the countdown reaches 0, the web calls `syncSession`. The server applies any expiry: it takes a life and starts a new round, or ends the run.
- **Grace window:** a guess received after `endsAt` plus the grace window (400 ms) returns `session_over`.

---

## 5. Duel over Socket.IO

### Handshake (`connect`)

- The handshake `auth` is `{ token, protocolVersion }`. `token` comes from `GET /auth/token`, fetched fresh for every attempt; `PROTOCOL_VERSION` is 1 (W30, B36).
- **Accepted:** the normal `connect` event. There is no ack.
- **Refused:** a `connect_error` whose `data` is the §2 failure envelope: `protocol_refused` (the web shows its update screen), `unauthorized` or `server_error`. A `connect_error` with no `data` is a transport failure (`network`). *Changed at B36: this file first said an ack.*
- **One connection per user:** a newer connection takes over. The old one gets an `error` event (`forbidden`, "You're connected somewhere else.") and is disconnected, and the web doesn't reconnect it by itself.

### Client → server commands

Every command is acked with the §2 envelope, `data` empty. **Outcomes arrive as events, not in the ack.** Every command can also be refused with `rate_limited` + `retryAfterMs` (B42, per user and per command) and `server_error`. A payload that fails validation gets `invalid_input`.

| Web method | Suggested event | Payload | Errors in the ack |
| --- | --- | --- | --- |
| `connect()` | handshake | `{ token, protocolVersion }` | `protocol_refused`, `unauthorized`, `server_error` (in `connect_error` `data`, not an ack) |
| `enterQueue()` | `queue:enter` | — | `forbidden` (already queued, or already in a duel) |
| `leaveQueue()` | `queue:leave` | — | `forbidden` (not queued) |
| `createRoom(filters)` | `room:create` | `Filters` | `forbidden` (queued, already hosting, or in a duel), `invalid_input`, `empty_pool` + `emptyBecause` (nothing stored) |
| `joinRoom(code)` | `room:join` | `{ code }` (6 characters, any case; the server uppercases) | `not_found` (no open room: wrong, expired, left, or **already full**), `forbidden` (your own room, or you're queued, hosting or in a duel), `invalid_input` |
| `leaveRoom()` | `room:leave` | — | `forbidden` (not hosting an open room) |
| `submitFilters(filters)` | `filters:submit` | `Filters` | `forbidden` (filters not open, or already submitted), `invalid_input`, `empty_pool` + `emptyBecause` (not stored, so a wider set may be sent) |
| `guess(request)` | `duel:guess` | `{ sessionId, guess }` (guess trimmed, 1–64) | `invalid_input` (another duel's id), `session_over` (round already ended, or duel not running), `forbidden` (not your turn) |
| `forfeit()` | `duel:forfeit` | — | `forbidden` (no duel running). Works on either player's turn |
| `disconnect()` | socket close | — | — |

### Server → client events (`DuelEventMap`)

`you` and `opponent` are always **from the receiving client's view**: the same moment reaches the two players with the actors swapped.

| Event | Payload | When |
| --- | --- | --- |
| `queued` | `QueueState` | After every accepted `queue:enter`, before `paired` even when it pairs at once. `since` is the server's time; the web samples its clock from it (W31a) |
| `queueTimedOut` | `QueueTimeout` | 60 s alone; the player is no longer queued. The web offers solo with the same filters. |
| `roomCreated` | `RoomState` | To the creator, after an accepted `room:create` (backend R6) |
| `roomExpired` | `RoomExpiry` | To the creator, 10 minutes after `roomCreated` if no one joined. The room is gone |
| `paired` | `PairedState` | Opponent found; the 30 s filter window opens |
| `filtersUpdated` | `FilterSubmission` | Each time either player submits, and once when the window closes |
| `coinFlip` | `CoinFlipResult` | Both submitted, or the window closed (a missing set is no preference). One set wins and is applied **whole**. In a room it follows `paired` at once, `source: 'room'`, with the creator as `winner` |
| `matchReady` | `DuelSession` | 2 s after `coinFlip`; the first round has started. Also the resume snapshot on a reconnect. **Authoritative**, from any phase |
| `roundStarted` | `DuelSession` | A new round starts; follows every `turnChanged` that doesn't end the duel. **Authoritative.** |
| `guessResolved` | `GuessResult` | Your own guess resolved (sent to the guesser only) |
| `playerRevealed` | `DuelFoundPlayer` | Either player names a new starter (sent to both) |
| `lifeLost` | `DuelLifeLost` | A clock expires |
| `turnChanged` | `DuelSession` | Handover, after a correct guess or an expiry |
| `opponentConnection` | `ConnectionState` | The opponent drops, comes back, or the window closes |
| `finished` | `DuelResult` | Win, loss, draw (all 11 named) or forfeit |
| `disconnected` | `ConnectionState` | **Your own** return inside the window: `connected`, then `matchReady`. The server never sends your own `reconnecting`; your socket is down then |
| `error` | `ApiError` | Errors outside a command ack: see *Errors outside an ack* below |

### Duel payload types

| Type | Fields |
| --- | --- |
| `QueueState` | `phase: 'queued'`, `since: epoch ms` |
| `QueueTimeout` | `phase: 'queued'`, `waitedMs: integer ≥ 0` |
| `PairedState` | `phase: 'paired'`, `opponent: DuelPlayer` |
| `FilterSubmission` | `yours: FilterSubmissionStatus`, `theirs: FilterSubmissionStatus` |
| `CoinFlipResult` | `winner: DuelActor`, `filters: Filters` (the set applied), `source: 'coin' \| 'room'` (R6, always sent) |
| `RoomState` | `code` (6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`), `filters: Filters`, `expiresAt: epoch ms` |
| `RoomExpiry` | `code` |
| `DuelPlayer` | `id`, `handle` (non-empty), `lives` (0–3) |
| `DuelLifeLost` | `who: DuelActor`, `lives: 0–3` (after the loss) |
| `ConnectionState` | `status: ConnectionStatus`, `reconnectDeadline: epoch ms or null` |

**`DuelSession`**

| Field | Type | Rule |
| --- | --- | --- |
| `sessionId` | id | |
| `match` | `MatchInPlay` | Both players name the same XI |
| `you` | `DuelPlayer` | |
| `opponent` | `DuelPlayer` | |
| `turn` | `DuelActor` | |
| `round` | `RoundTiming` | |
| `found` | `DuelFoundPlayer[]` | ≤ 11, the shared found-pool |

**`DuelResult`**

| Field | Type |
| --- | --- |
| `outcome` | `DuelOutcome` (receiver's view) |
| `match` | `MatchIdentity` |
| `found` | `DuelNamedPlayer[]`, sorted by `order` (backend R4b) |
| `you` | `DuelPlayer` |
| `opponent` | `DuelPlayer` |
| `isForfeit` | boolean |

`duelPhase` values used across the payloads: `queued`, `paired`, `filters`, `match_ready`, `playing`, `finished`.

### Duel behaviour the web relies on

**Event order** (B43's two-client harness pins it; if the web disagrees, the harness is right):

| What happened | The player who acted | The other player |
| --- | --- | --- |
| A correct, new name | `guessResolved`, `playerRevealed`, `turnChanged`, `roundStarted` | `playerRevealed`, `turnChanged`, `roundStarted` |
| An already-found name, or a name not in the XI | `guessResolved` | nothing |
| A round runs out | `lifeLost`, `turnChanged`, `roundStarted` | the same |
| The 11th name | `guessResolved`, `playerRevealed`, `finished` (draw) | `playerRevealed`, `finished` |
| The last life lost | `lifeLost`, `finished` | the same |
| `duel:forfeit` | `finished` | `finished` |

- **Private rooms (R6):**
  - `room:create` → `roomCreated`; the creator waits up to 10 minutes (`roomExpired`). `room:join` with the code → `paired` → `coinFlip` (`source: 'room'`, the creator's filters, no filter window) → `matchReady` 2 s later. Then the duel as below.
  - **The joiner names first,** since there was no flip.
  - **The creator's socket closing** before anyone joins closes the room: no reconnect window before the pairing. A second tab of the creator takes the connection over, so it closes the room too: joining your own code from another tab answers `not_found`, not `forbidden`.
  - **Rate limits:** `room:join` and `room:create` are 10 a minute each, per user (only when the backend's `RATE_LIMITS_ENABLED` is on).
  - History marks the game `isPrivate: true`; stats count it like any duel.
- **Nothing follows `finished`.** Outcomes pair up: `win` with `loss`, `draw` with `draw`, `forfeit_win` with `loss`. The player who forfeits gets a plain `loss`, with `isForfeit: true` on both sides.
- **The player who loses the coin flip names first.**
- **Expiry is the server's.** Its timer fires at `endsAt` + 400 ms, so `lifeLost` arrives about 0.4 s after the countdown hits 0. There is no sync call in a duel.
- **Reconnect window:** 20 s. The dropped player's clock **keeps running**. `opponentConnection` carries `reconnectDeadline` while it's open, then `connected`, or `forfeited` followed by `finished`.
- **Resume:** a reload mid-duel gets `disconnected` `connected`, then `matchReady`, before any command's ack. A `queue:enter` sent anyway is refused with `forbidden` (already in a duel), and the web ignores it.
- **After the window,** or after the duel ended while away, there is no `matchReady` and no replay. The result is in `GET /profile/history`, saved about 100 ms after `finished`.

**Errors outside an ack** (the `error` event):

| When | Code: message |
| --- | --- |
| The opponent leaves before `matchReady` | `session_over`: "Your opponent left." The pre-match room is gone |
| The winning filters' pool emptied between the flip and the load | `empty_pool`: "No match fits the winning filters." + `emptyBecause`. The room is gone |
| Another tab took the seat | `forbidden`: "You're connected somewhere else." (old socket only) |
| A server fault | `server_error`. Since backend R4b it also stands in for a step's events the server couldn't build, `finished` included, and nothing else follows. Mid-duel the web toasts it and rejoins: a live duel answers with `matchReady`, a closed one with nothing, and the web then reads the result from history |
| A command sent without an ack, then refused | that command's refusal. The web always asks for an ack |

---

## 6. Constants the two sides must agree on

| Constant | Value |
| --- | --- |
| Round length | 15 000 ms |
| Grace window | 400 ms, measured on server receipt |
| Lives | 3 |
| Squad size | 11 |
| Guess length | 1–64 characters, trimmed |
| Handle length | 3–24 characters, trimmed |
| Password length | 8–128 characters |
| History page | default 20, maximum 50 |
| Season range | 2000–2025 (season-start years) |
| Reconnect window | 20 s |
| Queue timeout | 60 s |
| Duel filter window | 30 s from `paired` |
| Coin-flip reveal | 2 s from `coinFlip` to `matchReady` |
| Socket heartbeat | ping every 10 s, 5 s timeout |
| Gateway token | 5 minutes |
