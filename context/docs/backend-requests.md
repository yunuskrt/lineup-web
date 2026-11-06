# Backend Requests — from lineup-web

Contract changes the web client needs. The backend owns the contract (`coding-standards.md` § The Contract), so each one is a **backend feature first**, merged and running before the web transcribes it. The scraper keeps its own list in `lineup-scraper/context/docs/backend-requests.md`; numbers continue that sequence.

| # | Request | Needed by | Asked | Status |
| --- | --- | --- | --- | --- |
| R3 | Filter options per competition, and competition logos | Web fixes Match Filters A and B | 2026-11-04 | **Done**: Part 1 (2026-11-04, backend R3a), Part 2 (2026-11-05, backend R3b) |
| R4 | The match on the solo offer, and the order and time of each named player | Web fixes Gameplay Visuals B and C | 2026-11-06 | **Done**: Part 1 (2026-11-06, backend R4a), Part 2 (2026-11-06, backend R4b) |

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
