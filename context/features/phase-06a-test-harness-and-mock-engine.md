# Phase W06a — Test Harness & Mock Engine

## Status

Not Started

## Goals

- Add **Vitest** and wire it to the repo's `@/` alias:
  - `vitest.config.ts` with `vite-tsconfig-paths` (or an explicit `resolve.alias` for `@/` → `./src`), `environment: 'node'`, and `include: ['src/**/*.test.ts']`.
  - `npm test` and `npm run test:watch` scripts in `package.json`.
  - Add `vitest/globals` to `tsconfig.json` types, or import `describe`/`it`/`expect` explicitly — pick one and apply it consistently.
- Create `src/lib/api/mock/data/seed.ts`, the **placeholder** dataset:
  - One competition, two clubs, one match with a `MatchIdentity`, and eleven players with slot, position and an alias set each.
  - Include at least one Latin Extended-A name (`İbrahimović`, `Čech`, `Özil`) and one deliberate surname collision inside the XI, because both are what the matcher has to survive.
  - Typed against the W02b schemas and parsed at module load, so a malformed fixture fails loudly rather than at first guess.
- Create `src/lib/api/mock/normalize.ts` — the normalization pipeline from `project-overview.md` § Guess Matching:
  - Unicode NFD → strip diacritics → explicit Turkish handling for `İ/ı/ş/ğ/ç` → `ñ`, `č`, `ø` → lowercase → collapse whitespace and punctuation.
  - Pure, no dependencies, exported as a single `normalizeName(input: string): string`.
- Create `src/lib/api/mock/matcher.ts`:
  - `resolveGuess(guess: string, squad: MockSquadEntry[]): MatchResolution` — exact alias hit first, then a fuzzy fallback.
  - **Squad-scoped collision rule** (HC / spec § Guess Matching): a bare surname ambiguous *within the current XI* does not resolve; the same surname ambiguous only against players outside the XI still resolves.
  - Fuzzy fallback is a local similarity score (trigram or Levenshtein ratio) with a tuned threshold — tight enough that `"Ronaldo"` never resolves to `"Ronaldinho"`.
- Create `src/lib/api/mock/clock.ts`:
  - `ROUND_DURATION_MS = 15000`, `GRACE_WINDOW_MS = 400`.
  - `startRound(now)` → `RoundTiming`, and `hasExpired(round, now)` applying the grace window on receipt.
  - Takes `now` as an argument everywhere — never reads the clock internally, so tests are deterministic.
- Create `src/lib/api/mock/engine.ts`, the pure rules core both adapters drive:
  - `resolveRound(state, input, now)` → `{ state, outcome }`, covering: correct-and-new ends the turn, already-found and not-in-XI leave timer and turn untouched, expiry costs exactly one life and passes the turn, all eleven named is terminal.
  - No I/O, no timers, no randomness — `now` and any random draw are passed in.
- Colocate `*.test.ts` beside each module. Mandatory coverage, mirroring what `coding-standards.md` demands of the backend `game` module:
  - `normalize.test.ts` — Turkish `İ`/`ı` round-trips, diacritic stripping, punctuation and whitespace collapse.
  - `matcher.test.ts` — alias hits, mononyms, the in-XI collision case vs the out-of-XI one, and the `Ronaldo`/`Ronaldinho` separation.
  - `engine.test.ts` — three lives, a life lost **only** to expiry, turn passing on correct-and-new, no turn change on the two no-penalty outcomes, terminal on eleven.

## Notes

- Scope: the test harness and the pure logic underneath both adapters. Out of scope:
  - `ApiClient` and `DuelClient` implementations → W06b and W06c.
  - Env-flag selection and registration → W06b.
  - Real fixture content → W07. The seed here is one match, explicitly placeholder.
  - Any React, any component, any route.
- **Why this phase exists separately.** It is the only genuinely testable logic in the repo so far, it is pure, and it needs no adapter to verify. Building it first means W06b and W06c are thin translation layers over something already proven, rather than logic and transport tangled together.
- **The boundary that matters most.** This code simulates the *server*. Hard Constraint 7 says the rules engine lives only in the backend and no client contains game logic — that stays true only because this is a test double confined behind the interface:
  - Nothing under `src/lib/api/mock/` may be imported by a component, a route or a hook. Only the adapters (W06b, W06c) import it.
  - It is never the fallback for a failed real request. When W27 lands, this becomes dev-only.
  - The matcher and engine here are a **stand-in, not a specification**. The backend's `game` module is authoritative (B27–B31); if the two ever disagree, the backend is right. Do not treat this as the reference implementation to port.
- **The fuzzy matcher will not equal the backend's.** Postgres `pg_trgm` + `unaccent` cannot be reproduced in JS, and trying would be wasted work. Tune this one until play *feels* right and record the threshold; W27 replaces it wholesale.
- Depends on: W02b (domain schemas), W05a and W05b only for the types the engine's state shape reuses.
- Constraints:
  - **The squad is never sent to the client** (HC 2) applies *inside* this module too: the engine's state holds the XI, but no exported function returns it wholesale. Only resolved players come out. Keeping that discipline here is what stops W06b leaking it through a response.
  - **Exactly 3 lives, lost only on expiry** (HC 9) and **a correct new answer ends the turn** (HC 10) are engine invariants with named tests, not incidental behaviour.
  - **Starting XI only** (HC 17) — eleven entries, no substitutes.
  - Purity: no `Date.now()`, no `Math.random()`, no module-level mutable state in `engine.ts`, `clock.ts`, `matcher.ts` or `normalize.ts`.
  - No `any`; `@/` imports only; functions under ~50 lines; comments only where a rule is non-obvious.
- **Deviations recorded during implementation:**
  - **`@types/node` bumped `^20` → `^22`.** Vitest 5 requires `^22 || >=24` as a peer; the repo ran Node 22.22.3 already, so the old pin understated the runtime. Chosen over `--legacy-peer-deps`, which would have hidden the conflict.
  - **`vite-tsconfig-paths` installed, then removed.** Vite 8 resolves tsconfig paths natively via `resolve.tsconfigPaths: true`, and the plugin pulled in a dependency npm reports as unmaintained. Config is `vitest.config.mts`, not `.ts`, so it loads as ESM without a config-loader warning.
  - **Vitest `globals: false`** — the spec allowed either; tests import `describe`/`it`/`expect` explicitly, so `tsconfig.json` needed no `types` entry.
  - **Damerau-Levenshtein, not plain Levenshtein or trigram.** `Ferreria` → `Ferreira` is a transposition, which plain Levenshtein scores as two edits (0.75) and the threshold rejected. Damerau charges a swapped pair once, giving 0.875, while `ronaldo`/`ronaldinho` stays at 0.70. **Tuned threshold recorded: `FUZZY_THRESHOLD = 0.82`.**
  - **The seed is deliberately fictional** — invented clubs and players, not a real historical XI. Hard Constraint 4 forbids an LLM being the source of a lineup or player identity, so writing one from memory was not available. The tricky name shapes the matcher needs are all present (`Şahin`, `Bjørn`, `Černý`, `Łucki`, two Moreaus for the in-XI collision).
  - **An ambiguous in-XI surname resolves to `not_in_xi`.** The W05a contract has exactly three guess outcomes and none means "which one?", so a player typing `Moreau` with two Moreaus in the XI is told the name is not in this XI. Implemented and tested as such, but it is wrong UX and the backend hits the same wall — **fixing it needs a fourth `GuessResult` branch, which is a contract change across three repos. Raise at B29.**
  - **`foundWithActor` was written, then removed** — nothing consumed it. The duel adapter adds it back in W06c rather than leaving a dead export here.
  - **The collision rule now spans the fuzzy path too** (found in review). The first implementation enforced ambiguity only on exact alias hits: `Moreau` was refused, but `Moreua` — one transposition — silently resolved to whichever Moreau came first in array order. `bestFuzzyMatches` now keeps every entry tied at the best score and returns `ambiguous` when more than one player ties.
  - **`remainingMs` removed from `clock.ts`** — nothing consumed it, and nothing will: the countdown ring at W10 is a component, and components may not import from `src/lib/api/mock/`. It computes from `RoundTiming` in its own layer.
- Verification:
  - `npm test` passes with real assertions — not placeholder tests. Every rule listed above has a named case.
  - `npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm run build` all pass.
  - `npm run build` output is unchanged (`/`, `/_not-found`, `/dev/theme`) — nothing here reaches a route yet.
  - Grep confirms no file outside `src/lib/api/mock/` imports from it.

## History
