# Pro F: Practice Mode

## Status

Not Started

## Goals

Pro practises a solo run with no lives and no clock. Practice runs aren't saved and never count toward the daily cap. Needs **Pro A**, **Pro E** (to practise a picked match) and backend **R14** on `main`.

- **The contract, transcribed from R14:**
  - `soloStartRequestSchema` gains `practice: z.boolean().optional()`.
  - `soloSessionSchema` and `soloSummarySchema` gain `practice: z.boolean()`.
- **`/play`, Solo selected:**
  - **Open:** a checkbox under the filters, "Practice: no clock, no lives, not saved". Its state goes in the URL as `?practice=1`, and Start reads "Start practice".
  - **Locked:** the checkbox drawn as a `ProLock` ("Practice is part of Pro.").
  - **Practice hides the daily-cap line** (C): practice never counts.
- **The archive rows** (open) gain **Practice** beside Play: `/play/solo?match=<id>&practice=1`.
- **The game canvas in practice** (the server's `practice: true` decides, not the URL):
  - **No countdown ring and no Lives card.** A "Practice" tag sits at the top of the rail in their place.
  - The input is always live. The solo run never syncs at 0, since `round` is always `null`.
  - **Sounds:** no ticks, no final beeps, no whistle; the guess cues stay.
  - Quit stays. Quitting asks once, as today.
- **The summary of a practice run:**
  - The title is tagged "Practice". There is no lives line, and the "time per round" line becomes "time per find".
  - The missed reveal works as it does for Pro.
  - **Actions:** Practise again (same filters, or the same match) and Back to play.
  - Nothing says it was saved: it wasn't.
- **Profile:** unchanged. Practice never appears in history or stats.
- **The mock:** practice runs with no clock and no life loss, ending on 11 found or quit; it saves nothing to the mock profile and doesn't count toward the cap. It refuses an effective-`free` user with `pro_required`.
- **Dev snapshots:** `?state=practice` (mid-run), `practice-summary`, and `/play` with the locked checkbox.
- **Tests (pure):**
  - Schemas with and without `practice`.
  - The canvas pieces for a practice session (no ring, no lives, the tag).
  - The sound-cue diff: no clock cues in practice.
  - The summary lines and actions for practice.
  - The mock: no expiry over a long fake time; 11 finds → perfect clear; nothing in history; the cap unchanged; Free refused.
- **Docs:**
  - `context/theme.md` § Solo: a "Practice" row (no ring, no lives, the tag; the summary).
  - `context/docs/contract.md`: `practice` on the start body, the session and the summary.
  - `context/docs/pro-features.md`: #5 marked done, and every Pro feature done.

## Layout

```text
/play/solo in practice (rail)

┌──────────────┐
│ Practice     │
│              │
│ [ guess… ]   │
└──────────────┘
(no ring, no lives)
```

## Out of Scope

- Practice in a duel or a room: never.
- Saving practice runs anywhere (user, 2026-11-10: not saved at all).

## Open Questions

Defaults stand unless changed at load:

- **The checkbox wording:** "Practice: no clock, no lives, not saved".
- **The summary's actions:** Practise again, then Back to play.

## Notes

- **Source:** user request (2026-11-10), item #5. Decision: practice runs are not saved at all.
- **Order:** sixth and last. Needs A and E.
- **Hard constraints:**
  - **1, 7:** the server runs practice; the web hides the ring and the lives because the session says `practice`, and decides nothing.
  - **9:** lives still exist only in timed runs; practice has none to lose.
  - **15:** solo only.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters; reduced motion unchanged.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, Pro:** tick Practice → Start practice → no ring and no lives, guesses resolve, wait well past 15s with no life lost, name all 11 → the Practice summary → the profile history is unchanged.
  - **Mock, Free, switch on:** the locked checkbox; `?practice=1` by URL shows the locked gate.
  - **Mock:** practice from an archive row plays that match.
  - **Real, Pro:** the same run; the backend saves nothing (the history and `GET /solo/allowance` are unchanged after it).
  - **Real, `PRO_ENABLED=false`:** a fresh guest practises.
