# Pro C: The Solo Daily Cap

## Status

Not Started

## Goals

With the switch on, Free plays 5 solo runs a day, resetting at UTC midnight; Pro is unlimited. Duels are never capped. Needs **Pro A** and backend **R11** on `main`.

- **The contract, transcribed from R11:**
  - `soloAllowanceSchema = { limit: int | null, used: int, resetsAt: epoch ms }` (`src/lib/api/schemas/solo.ts`). `limit` is `null` when unlimited.
  - **`SoloApi` gains `getAllowance()`** → `GET /solo/allowance`, in the HTTP client and the mock.
  - `findMatch` and `chooseSide` can fail with `forbidden` + `reason: 'daily_cap'` + `retryAfterMs`.
- **`useSoloAllowance()`** (TanStack Query, needs a session). It is invalidated when a side is picked and when a run ends.
- **The web never counts.** Every number shown is the server's.
- **`/play`, Solo selected:**
  - **Runs left** (Free, the switch on, runs left): a 14px `fg-muted` line under Start: "3 of 5 solo runs left today".
  - **At 0:**
    - Start is disabled, and the line reads "You've played your 5 solo runs today. More at 01:00." (`resetsAt` in the player's local time).
    - **Play a duel** (switches the mode to Duel, filters kept) and **See Pro** sit under it. Never a dead end (`theme.md` § Lobby).
  - **Unlimited** (Pro, or the switch off): nothing is shown, as today.
  - **No session yet:** nothing is shown. A new guest has all 5 left.
- **`/play/solo` refused with `daily_cap`** (a direct URL, a second tab, or a reset that hasn't come yet):
  - The canvas gate shows the same message, with **Play a duel**, **See Pro** and **Back to play**.
  - A new failure step in the solo run, keyed by `reason`.
- **The summary's Play again:** when the allowance shows 0 left, Play again is replaced by the cap message and Play a duel. Otherwise it is unchanged.
- **The mock:** counts side picks per mock user per UTC day, refuses past 5 for an effective-`free` user, and answers `getAllowance()`.
- **Dev snapshots:** `/play` with 3 left and with 0 left (a `?state=` on `/play`, or `/dev/pro`); `?state=solo-daily-cap` for the gate; a summary at 0 left.
- **Tests (pure):**
  - A helper `allowanceLine(allowance, now)`: the runs-left line, the 0-left line with the local reset time, and nothing when unlimited.
  - The solo run's `daily_cap` failure.
  - The mock: 5 side picks then a refusal; offers don't count; a new UTC day resets; Pro is never refused.
- **Docs:**
  - `context/theme.md` § Solo: a "Daily cap reached" row.
  - `context/docs/contract.md`: `GET /solo/allowance`, `SoloAllowance`, the `daily_cap` refusal.
  - `context/docs/pro-features.md`: #3 marked done.

## Layout

```text
/play, Solo, Free (switch on)

[ Start solo run ]
3 of 5 solo runs left today

At 0:

[ Start solo run ]  (disabled)
You've played your 5 solo runs today. More at 01:00.
[ Play a duel ]   See Pro
```

## Out of Scope

- Any cap on duels or rooms: never.
- Practice runs (F): they never count.

## Open Questions

Defaults stand unless changed at load:

- **The reset time is shown in local time** ("More at 01:00"); the server still resets at UTC midnight.
- **The runs-left line is hidden while unlimited,** so nothing says Pro with the switch off.

## Notes

- **Source:** user request (2026-11-10), item #3. Decisions: 5 a day, UTC midnight, counted when the side is picked.
- **Order:** third of six. Needs A.
- **Hard constraints:**
  - **1, 16:** the server counts and refuses; the web shows its numbers.
  - **15:** duels are untouched, and free duels are never capped.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, switch on, Free:** five runs (pick a side, quit), watching the line count down; the sixth Start is disabled, and Play a duel switches to Duel; `/play/solo` by URL shows the gate.
  - **Mock, Pro, or the switch off:** no line, no refusal after five runs.
  - **Real, backend `PRO_ENABLED=true`:** the same five-run check as a fresh guest; the backend's `GET /solo/allowance` matches the line.
  - **Real, `PRO_ENABLED=false`:** six runs in a row work.
