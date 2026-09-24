# Phase W07b — Adapters on Fixtures

## Status

Not Started

## Goals

- Move `src/lib/api/mock/shared.ts` off the seed:
  - `maskedMatchFor(fixture, side)`: team and formation come from that fixture's side.
- Rewire `src/lib/api/mock/api-client.ts` onto `pool.ts` and `fixtures.ts`:
  - `createMockApiClient({ now, random })`. `random` is injected like `now`, defaulting to `Math.random`.
  - `StoredSession` gains `fixtureId` (in `store.ts`). Every read of match identity, squad or missed players goes through the session's fixture, never a module constant.
  - `catalog.getFilterOptions` returns `filterOptionsFrom(FIXTURES)`.
  - `solo.findMatch` calls `selectFixture`. On an empty pool, the `empty_pool` message **names the filter to widen**, with a distinct message for `combination` (`theme.md` § System: "Never 'no results'"). On success it returns that fixture's `home` / `away` clubs.
  - `solo.chooseSide` builds the engine from `squadFor(fixture, side)`.
  - `finalize` writes the session's `MatchIdentity` to history. `favouriteClub` becomes the club the player has played as most across finished sessions, with ties going to the most recent. It is no longer a constant.
  - Delete `seasonStartYear` and `narrowFilter`; `pool.ts` owns both jobs now.
- Rewire `src/lib/api/mock/duel-client.ts`:
  - The scripted opponent submits its own filter set (wide: every competition, the full era), distinct from yours.
  - `coinFlip` carries **the winner's** filters, not always yours. The fixture is then selected from that set, applied whole (HC 19).
  - `submitFilters` returns `empty_pool` (naming the filter) when your own set selects nothing. The player widens before submitting, so a coin flip can never land on an empty pool.
  - The side is picked by the injected `random`, standing in for the server's weighted pick (B32). The mock does not imitate the weighting.
  - `matchReady`, the reveal pool and `DuelResult.match` all read from the selected fixture.
- Delete `src/lib/api/mock/data/seed.ts`. Repoint every test that imported it:
  - `engine.test.ts`, `matcher.test.ts` and `types.test.ts` use `squadFor` on a **named fixture** chosen for the case at hand. The collision tests use the in-XI-collision fixture, and there is a new case for the cross-XI collision.
  - `api-client.test.ts`, `duel-client.test.ts` and `shared.test.ts` inject `random` and assert against the fixture it selects.
- New cases:
  - `findMatch` honours each filter, and each `emptyBecause` produces its own message.
  - Choosing `away` yields the away XI. A home-XI name is `not_in_xi` there.
  - Two finished runs on different fixtures appear in history with their own identities, and `favouriteClub` follows play.
  - In a duel, the opponent winning the flip applies the opponent's filters. Your empty filter set is refused at `submitFilters`.
  - The HC 2 "no unrevealed player in any response" case runs across **every** fixture and both sides, not one.

## Open Questions

Carried forward, and not decided here:

- **Empty pool in a duel.** The duel contract has no event for it, so the mock refuses at `submitFilters`. The backend has to choose between that and a server-side event at B38. Record whichever wins.
- **Slot convention.** Inherited from W07a. It stays a client assumption until B03 confirms it.

## Notes

- Scope: switching both adapters from one placeholder match to the W07a dataset. Out of scope: any UI, new contract fields, duel results feeding profile stats (W06c scope), a Pro tier override (still unreachable, per W06b).
- Depends on: W07a (dataset, `pool.ts`, `squadFor`), W06b, W06c.
- Constraints:
  - **No game logic outside `src/lib/api/mock/`** (HC 7). Selection, filtering and favourite-club derivation are the mock standing in for the server. None of it may leak into a hook or component.
  - **The squad is never sent** (HC 2). The session stores a `fixtureId`, and responses still carry only revealed players.
  - **Coin flip applies one set whole** (HC 19): never merged, never intersected, and both players are told whose.
  - No contract change. Every shape here already exists in W05a/W05b; if one turns out not to, stop and raise it, don't widen the contract in the mock.
  - `@/` imports only, no `any`, structured `ApiResult` everywhere, no silent catch.
- Verification:
  - `npm test` passes, with every existing case repointed and the new cases above named.
  - `npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm run build` all pass.
  - Grep finds no remaining `SEED_` or `data/seed` reference.
  - A throwaway script (deleted after) drives `getApiClient().solo` twice with different filters and prints two different match identities plus a profile whose `favouriteClub` matches the side played.
