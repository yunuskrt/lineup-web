# Phase W07a — Fixture Dataset

## Status

Not Started

## Goals

- Extend `src/lib/api/mock/types.ts` with the fixture shape, all types via `z.infer`:
  - `mockPlayerSchema`: `id`, display `name`, `aliases` (normalized strings, min 1). This is the player registry entry and carries no position.
  - `mockLineupEntrySchema`: `playerId`, `slot`, `position`. Position lives on the lineup, because one player can start as a DF in one match and a MF in another.
  - `mockSideSchema`: `formation` + an eleven-entry lineup.
  - `mockFixtureSchema`: `identity` (the W02b `matchIdentitySchema`) + `home` and `away` sides.
  - Refinements on the fixture: no player on both sides; home and away clubs differ; formation lines sum to 10; each slot's position agrees with the slot convention below; the season format matches the competition kind (`YYYY-YY` for `league`/`ucl`/`uel`, `YYYY` for `world_cup`/`euro`); the date falls inside that season.
  - Keep `mockSquadSchema` / `MockSquad` unchanged. The engine still consumes a flat squad; W07a only adds how one is built.
- Create the dataset under `src/lib/api/mock/data/` as plain, JSON-shaped literals (no functions, no computed values):
  - `competitions.ts`: competitions and clubs, including the national sides for tournaments.
  - `players.ts`: the player registry.
  - `matches.ts`: fixtures, each referencing competition, club and player ids.
- Create `src/lib/api/mock/data/fixtures.ts`, which joins the three into parsed `MockFixture`s at module load, so a bad id or malformed fixture throws at import, not at first guess. It exports:
  - `FIXTURES`, the parsed list.
  - `fixtureById(id)`.
  - `squadFor(fixture, side): MockSquad`, which flattens registry name and aliases with lineup slot and position into the engine's squad shape.
- Create `src/lib/api/mock/pool.ts`, pure selection over `FIXTURES` (or an injected list):
  - `filterOptionsFrom(fixtures)`: the competitions and clubs present, plus the era range derived from the earliest and latest season start.
  - `selectFixture(filters, random, fixtures?)`: returns `{ fixture }` or `{ emptyBecause: 'competition' | 'club' | 'era' | 'combination' }`. When the pool is empty, drop each filter in turn and blame the first one whose removal yields a match. If none does alone, return `combination`.
  - Uniform random over the matching set. Stratified sampling is a backend concern (B25), not the mock's.
- Add `src/lib/api/mock/data/fixtures.test.ts`, the integrity suite:
  - Every fixture parses; fixture, player, club and competition ids are unique; every referenced id resolves.
  - Every alias is already normalized (`normalize(alias) === alias`), and every player's normalized full name is among their aliases.
  - The coverage matrix below holds, asserted by count and not eyeballed.
  - Every name-shape case in the matrix resolves through the existing matcher the way it should: an in-XI collision misses, a cross-XI collision hits, and a near-miss pair does not cross-resolve.
- Add `src/lib/api/mock/pool.test.ts`: each filter narrows correctly; each `emptyBecause` value is reachable; an injected `random` makes selection deterministic; with no filters, repeated draws reach more than one fixture.

## Data

**Everything is fictional.** Invented competitions, clubs, national sides, players, scores and dates. Nothing is a real historical XI, and nothing should look like a lightly disguised one. Hard Constraint 4 rules out an LLM authoring real lineups, and the user chose a fully fictional mock dataset over hand-transcribed real matches. Say so in a one-line header comment in each data file.

Coverage the integrity suite asserts:

| Dimension         | Requirement                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Size              | 8–10 fixtures, both XIs each                                                                         |
| Competition kinds | At least one of every `competitionKindSchema` value; two distinct `league` competitions             |
| Eras              | At least two fixtures in each bucket: 2000–07, 2008–15, 2016–25                                      |
| Clubs             | At least one club in ≥3 fixtures, so a single-club filter returns a real choice                      |
| Formations        | At least four distinct, including one with four or five lines (`4-2-3-1`, `4-1-2-1-2`) for W09      |
| Identity          | A mix of `stage` values (final, semi-final, group, matchday) and of `nickname` present / `null`      |
| Images            | `crestUrl` and `imageUrl` are `null` throughout (licensing — `project-overview.md` § Data)          |

Name shapes the matcher and the reveal card must survive, each present at least once:

- Turkish `İ ı ş ğ ç`, plus `ñ`, `č`, `ø`, `Ł`: Latin Extended-A in real use, not just one per fixture.
- **In-XI surname collision.** Two players sharing a surname in one XI. A bare surname stays ambiguous and resolves to `not_in_xi` (the W06a behaviour, flagged for B29).
- **Cross-XI collision.** The same surname in the opposing XI only. A bare surname is accepted, because ambiguity only matters inside the XI.
- **Mononym and nickname** aliases (the Ronaldinho / Xavi shape).
- **Near-miss pair**, in the "Ronaldo" vs "Ronaldinho" shape, across two fixtures or two sides. Neither resolves to the other.
- Particles and punctuation: `van der`, `de`, a hyphenated surname, an apostrophe (`O'…`).
- **A recurring player**: the same `playerId` starting for different clubs in different eras. This gives W24's most-missed stats and B09's `players` table a real many-to-many.
- The longest display name the reveal card must fit: at least one at ~24 characters.

## Slot Convention

`slot` is the only layout signal the client gets (`RevealedPlayer.slot`), so its meaning is fixed here and W09 renders against it:

- Slot `0` is the goalkeeper.
- The formation string lists outfield lines from defence to attack. Slots `1…10` fill those lines in order, left to right within a line.
- The first line is `DF`, the last line is `FW`, and every line between is `MF`. `4-2-3-1` is therefore DF×4, MF×2, MF×3, FW×1.

This is a **client-side assumption about the contract**, not something the backend has defined yet. Raise it at B03 so the real payload either adopts it or replaces it before W29.

## Notes

- Scope: the dataset, its schema and pure selection. Out of scope:
  - Rewiring either adapter → W07b. Both keep running on `seed.ts` until then, and `seed.ts` is not deleted here.
  - Memorability scores and the guessability gate. Every mock fixture is in the pool by construction, and HC 20 means no score would be rendered anyway.
  - Any UI.
- **Why it splits here.** The dataset and its integrity suite are proven by `npm test` alone. The adapter rewire changes behaviour across two adapters and their tests. Landing the data first means W07b is a mechanical switch onto something already validated.
- **B09 seeds the backend's dev branch from this data.** No code crosses repos, so B09 transcribes it. That is why the data files are plain literals in a registry / lineup split that mirrors the `players` / `lineups` tables, and not one nested blob.
- Depends on: W06a (`normalize`, matcher, `mockSquadSchema`), W02b (`matchIdentitySchema`, `competitionKindSchema`, era bounds).
- Constraints:
  - **No LLM-sourced real data** (HC 4). Fictional throughout. A name that happens to match a real player is fine; a real XI is not.
  - **The squad never leaves the mock** (HC 2). `fixtures.ts` and `pool.ts` sit under `src/lib/api/mock/`, and nothing outside that directory may import them.
  - **Starting XI only** (HC 17). No substitutes field, not even as unused data.
  - Seasons stay within `FIRST_SEASON_START`–`LAST_SEASON_START`.
  - No hex, no UI, `@/` imports only, no `any`, types from `z.infer`.
- **Deviations recorded during implementation:**
  - **Parsed fixtures carry resolved squads, not lineups.** Each side of a `MockFixture` is `{ formation, squad: MockSquad }`, flattened once at load. `squadFor` is therefore a plain accessor, and the lineup shape lives on `mockFixtureRecordSchema` (the id-referencing record) instead of the parsed fixture.
  - **`buildFixtures(source)` is exported** so corruption is tested automatically. Duplicated slot, wrong position, unknown id, league `YYYY` season, date outside season, a player on both sides and an unnormalized alias each have a named test. This replaces the manual corrupt-and-revert step.
  - **Alias rules are enforced at load**, by `mockPlayerSchema` (normalized, unique, includes the full name), as well as by the integrity suite.
  - **`positionForSlot` is exported from `types.ts`.** It encodes the slot convention. W09 cannot import it (mock-only), so the client reimplements it.
  - **Only crests are asserted `null`.** The player registry has no image field at all, and the adapters set `imageUrl: null` themselves.
  - **Two checks added:** only the deliberate `harlow` collision exists inside any XI, and every declared competition, club and player is used by some fixture.
  - **`filterOptionsFrom` sorts by name** and defaults to `FIXTURES`; an empty list yields the full era range.
  - Dataset as built: 10 fixtures, 6 competitions, 11 clubs/nations, 167 players. Recurring players include Ferreira, van der Linde, Delacroix-Morel, Friedl, Bjørnsen and Şimşek.
- Verification:
  - `npm test` passes: integrity, coverage matrix, name shapes and pool suites.
  - Temporarily corrupting one fixture (a duplicated slot, an unknown `playerId`, a `YYYY` season on a league) makes the import throw with a readable message. Revert afterwards.
  - `npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm run build` all pass.
  - Grep confirms nothing outside `src/lib/api/mock/` imports `mock/data/*` or `mock/pool`.
