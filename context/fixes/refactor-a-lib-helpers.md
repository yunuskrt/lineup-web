# Fix — Refactor A: Small Lib Helpers

## Status

Completed

## Goals

Phase 2 of `context/docs/code-cleanup-guide.md`, batch refactor-a. Items approved by the user on 2026-11-18 (refactor-scanner report, items 3, 9, 10, 11, 12 and a). **Behaviour-preserving: every string, URL and value stays byte-identical.**

- **3. Rate-limit copy:** `src/lib/system-states.ts` exports `secondsPhrase(seconds)` ("1 second" / "3 seconds") and `tooManyAttemptsMessage(seconds)` ("Too many attempts. Try again in 3 seconds.").
  - `auth.ts` `rateLimitedMessage` returns `tooManyAttemptsMessage(cooldownSecondsLeft(retryAfterMs))`;
  - `cooldownGateDetail` returns `tooManyAttemptsMessage(Math.max(1, secondsLeft))`;
  - `cooldownAnnouncement` uses `secondsPhrase`; its "Too many guesses" wording stays.
- **9. Plurals:** `src/lib/plural.ts` exports `pluralOf(count, one, other)`, used where a count picks between two words:
  - `profile.ts` (`duelCountLabel`), `suggestions.ts`, `archive.ts` (`match`/`matches`), `landing.ts` (`labelFor`), `components/play/FilterPanel.tsx`, `components/game/RunSummary.tsx`.
  - A site whose shape doesn't fit (it would need more than `pluralOf` and the count) keeps its own code.
- **10. UTC date labels:** `src/lib/date-label.ts` exports `utcDateLabel(format, isoDate)`. `summary.ts` `matchDateLabel` and `archive.ts` `archiveDateLabel` keep their own formatters and call it.
- **11. `wait`:** `src/lib/wait.ts` exports `wait(ms)`. `hooks/use-duel.ts` and `lib/api/socket/duel-client.ts` drop their local copies.
- **12. URL params:** `archive.ts` `withoutPickedMatch` becomes `withoutParams(params, [PICKED_MATCH_PARAM])`, and `filters.ts` `withFilters` drops its own delete loop for `withoutParams` over the four filter keys.
- **a. `/config` max-age:** one `CONFIG_MAX_AGE_SECONDS = 300` in `src/lib/api/config.ts`, with the "backend's own max-age" comment.
  - `pro-switch.ts` uses it for `revalidate`, and `CONFIG_REVALIDATE_SECONDS` goes;
  - `hooks/use-pro.ts` uses `CONFIG_MAX_AGE_SECONDS * 1000`, and `APP_CONFIG_STALE_TIME_MS` goes.

## Out of Scope

- The two `/config` reads stay separate (server, Next cache; client, credentialed). Only the constant is shared.
- The mock adapter's own copies. Every other stale-time constant (each is tuned per query).

## Notes

- **Source:** `refactor-scanner` report, step 2.1 of the guide.
- **Constraints:** `@/` imports; no `any`; comments one line, at most 75 characters; no import cycles (`system-states.ts` imports only types today, so `auth.ts` may import it).
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - unit tests for `secondsPhrase`, `tooManyAttemptsMessage`, `pluralOf`, `utcDateLabel` and `wait`; the existing label, auth, archive, filters, summary and socket tests stay green unchanged;
  - B5: `/profile`, `/archive` and `/play?mode=solo&step=filters` (labels), and `/play/solo?state=rate-limited` and `/play/duel?state=duel-rate-limited` (cooldown copy; frozen-clock rule).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **Item 9, `landing.ts`:** its `labelFor` wrapper is gone; `figure` calls `pluralOf(value, plural.one, plural.other)` directly.
  - **Items 3 and 9 together:** `secondsPhrase` is built on `pluralOf`, so `system-states.ts` now imports `@/lib/plural` (still no cycle: `plural.ts` imports nothing).
  - **B5, A/B beyond live clocks:** `/play?mode=solo&step=filters` at 1280 never matched the baseline. With the clock frozen it flips between two renders on `main` too (`8709a579`, `08ec4c28`), and the branch gave only those two. The guide's A/B rule now covers any shot that never matches, not only live clocks.
  - **Follow-ups, not this batch (review):**
    - `play-steps.ts` `withModeOption` and `withStep`, and `practice.ts` `withPractice`, still copy params and delete keys by hand; they could use `withoutParams`.
    - `withoutParams` is a general URL helper living in `filters.ts`; a `lib/url-params.ts` would let `practice.ts` use it without importing the filters module.
    - `secondsPhrase` and `tooManyAttemptsMessage` don't clamp to one second themselves; every caller does today.
    - `auth.ts` imports `system-states.ts` only for that seconds copy; both helpers could move to a leaf module beside `plural.ts`, with `url-params.ts`.
    - `cooldownLabel` ("…in 3s") is a third rate-limit builder; its short form is deliberate, so it stays unless the copy is unified.
  - **`utcDateLabel` comment (review):** it states the caller's precondition (a UTC formatter) instead of promising no shift; both callers pass one.
