# Phase W02b — Domain Types & Schemas

## Status

Not Started

## Goals

- Add `zod` as a dependency. Before writing schemas, check the installed major's API via Context7 (v4 moved string formats to `z.iso.*` and friends).
- Create `src/lib/api/schemas/common.ts`:
  - `sideSchema`: `'home' | 'away'`.
  - `competitionKindSchema`: `'league' | 'ucl' | 'uel' | 'world_cup' | 'euro'`.
  - `eraRangeSchema`: season start years bounded 2000–2025, refined so `from <= to`.
  - `filtersSchema`: competition ids, club ids and era range. **No difficulty field.**
  - `webUrlSchema`: `http`/`https` only; the source for every image URL.
- Create `src/lib/api/schemas/match.ts`:
  - `clubRefSchema`: id, name, short name, nullable crest URL.
  - `maskedMatchSchema`: what the player sees mid-game. Match id, side, the team being guessed and its formation string. Competition and date are omitted.
  - `competitionRefSchema`: id, kind and name.
  - `matchIdentitySchema`: the full reveal for summary and result screens. Competition ref, season label (`2004-05` or `2006`), date, stage, home and away clubs, score, and a nullable nickname.
- Create `src/lib/api/schemas/player.ts`:
  - `revealedPlayerSchema`: id, display name, formation slot index 0–10, position group `GK | DF | MF | FW`, nullable image URL.
- Create `src/lib/api/schemas/game.ts`:
  - `guessResultSchema`: a discriminated union on `outcome`.
    - `correct_new` carries a `RevealedPlayer`.
    - `already_found` carries the found player's id.
    - `not_in_xi` carries nothing.
  - `livesSchema`: integer 0–3.
  - `roundTimingSchema`: server `startedAt` and `endsAt` in epoch ms.
  - `soloEndReasonSchema`: `'lives_out' | 'quit' | 'perfect_clear'`.
  - `duelOutcomeSchema`: `'win' | 'loss' | 'draw' | 'forfeit_win'`.
- Create `src/lib/api/schemas/user.ts`:
  - `tierSchema`: `'free' | 'pro'`.
  - `userSchema`: id, handle, `isGuest`, tier.
- Create repo-local types under `src/types/`, derived only via `z.infer` from the schemas above and grouped by feature: `filters.ts`, `match.ts`, `player.ts`, `game.ts`, `user.ts`.

## Notes

- Scope: domain primitives only. Out of scope:
  - Request/response envelopes, endpoint signatures and the `{ success, data, error }` result shape → W05 (API Client Interface).
  - Duel-specific socket payloads (turn owner, `foundBy`, opponent state, coin-flip result) → W22/W23.
  - `PROTOCOL_VERSION` → W30.
  - Mock data → W07.
- These shapes are a **provisional transcription**. The backend owns the contract and does not exist yet. Web drafts it here, B09 seeds from the web mock fixtures, and W27 reconciles every schema against the real OpenAPI doc. Where they differ, the backend wins.
- Contract decisions (settled in review):
  - The season label is `YYYY-YY` for leagues or `YYYY` for tournaments. `YYYY-YY` alone would reject every World Cup and Euro match.
  - Filters select by `competitionIds`, not by kind. A single `'league'` kind couldn't tell the Premier League from Serie A. `kind` stays on `CompetitionRef` so the UI can group leagues and tournaments.
  - Image and crest URLs go through `webUrlSchema` (`http`/`https` only). Plain `z.url()` accepts `javascript:`, `data:` and `file:`.
- Deferred from review:
  - The penalty shootout score, for the W21 summary.
  - A server "now" value for clock skew, for the W10 countdown ring.
  - Port the throwaway parse checks to Vitest when it lands (W06/W10).
- Depends on: W02a (only for ordering; there is no code dependency).
- Constraints:
  - **The squad is never sent to the client** (Hard Constraint 2). No schema may represent the full XI or an unrevealed player's identity. The masked match carries formation only, so the grid can draw 11 empty slots.
  - **Starting XI only** (HC 17): slot index 0–10, no substitute fields.
  - **`memorability_score` is never exposed** (HC 20): no score, difficulty or rating field anywhere.
  - **Tier is resolved server-side** (HC 16): `tier` is read-only data received from the backend. No client helper derives or asserts it.
  - **No game logic in the client**: schemas and types only. No `isCorrect`, no lives arithmetic, no timer-expiry check. `livesSchema` bounds the value; it does not compute it.
  - Types come from `z.infer`, never hand-written next to a schema. No `any`. Internal imports use `@/`. Schema constants are camelCase `*Schema`; types are PascalCase.
- Verification:
  - `npm run lint`, `npm run format:check` and `npm run build` all pass.
  - `npx tsc --noEmit` is clean.
  - A quick throwaway parse check shows each discriminated-union branch of `guessResultSchema` accepting its valid shape and rejecting a mismatched one. Do not commit the check; Vitest arrives later.

## History
