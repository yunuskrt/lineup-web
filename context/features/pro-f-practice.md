# Pro F: Practice Mode

## Status

Completed

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
- **Deviations recorded during implementation:**
  - **The find time is uncapped for solo:** `namedPlayerSchema.elapsedMs` loses its 15 000 maximum (R14), and `duelNamedPlayerSchema` sets the cap again on its own field.
  - **No "time per round" line existed to rename:** `roundTimesMs` isn't shown since Gameplay Visuals C. Instead the named list reads finds past a minute as minutes (`findTimeLabel`: 1:14, 12:34), for every mode; under a minute nothing changes.
  - **The practice rail** is one card in place of the ring and the Lives card: "Practice" and "No clock and no lives. Name all eleven, or quit when you like. This run isn't saved."
  - **The practice summary** keeps its title ("Run ended", "Perfect clear") and shows a "Practice" tag where the lives were.
  - **The archive button is "Practise"** (the verb, as "Practise again"), named for screen readers like Play. Phones drop the nickname from a row's second line so the competition keeps its room beside the two buttons.
  - **The locked toggle** is a `ProLock` labelled "Practice", captioned "Practice is part of Pro: no clock, no lives, not saved." (pending: no caption).
  - **The warning over a run in play** (R14 asked for it): this tab remembers an unfinished timed run in `sessionStorage` (`lineup:open-run`), set while one is in play and cleared at its end, when the run is gone, or once practice starts (the pure `openRunUpdate` decides mark or clear). Start practice on `/play` and Practise on the archive then ask "Practise now?" with Cancel (focused) and Practise. `QuitDialogCopy` gains `dismissLabel`. Without storage there's no warning, never a crash.
  - **Two practice gates:** Free gets "Practice is part of Pro" with "A timed run from your filters is still free.", Back to play and See Pro (also when a match was picked, as R14's message wins). After R14's idle drop: "This practice run has closed", "Practice runs close after 30 minutes without a guess.", Back to play.
  - **Back to play keeps practice ticked** on `/play`; a duel always drops it.
  - **Sounds needed no change:** the clock cues key off the round (always null in practice) and the whistle off a lives drop that never comes; tests lock it in.
  - **The run asks, the session decides:** `finding` carries the request (`isPracticeAsked`, for the gate copy); `SoloCanvasView.isPractice` comes only from the session or the summary.
  - **The mock** gains a clockless engine path (`practice`, `since`): no expiry, uncapped find times, perfect clear on 11, nothing saved, no cap count, and Free refused first. It doesn't model R14's one-open-run rule or the idle drop.
  - **Snapshots:** the locked, open and pending Practice toggles live on `/dev/pro` (beside C's `/play` specimens), not a `?state=` on `/play`. Two more canvas snapshots join `practice` and `practice-summary`: `solo-practice-locked` and `practice-closed`, both built through the run's own reducer.
  - **The mock checks ran as unit tests, not in a browser,** as in D and E; the same screens were checked live.
  - **Checked live** (2026-11-12, 3000 against 8080, ingest database, `PRO_ENABLED=true`): Free guest `guest-5zqtktpo` saw Practice locked on `/play?practice=1` (Start stayed "Start solo run") and the practice gate on `/play/solo?practice=1`. After the tier script made it Pro: the tick set `?practice=1` and Start read "Start practice" with no cap line; the run showed the Practice card with no ring or lives, stayed live after 17 seconds, and its summary showed the tag, Practise again and Back to play; history and `GET /solo/allowance` `used` were unchanged. A timed run left in play brought up the warning; Cancel stayed on `/play`, Practise started practice, and the left run appeared in history as a quit. Practise on AC Milan 3–3 Liverpool FC opened that match in practice.
  - **Checked live with `PRO_ENABLED=false`** (ingest): a signed-out visitor saw the Practice checkbox open with no word "Pro" on `/play`, ticked it, got a guest and a practice run with the Practice card, quit, and the summary offered Practise again and Back to play; the guest's history stayed empty.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, Pro:** tick Practice → Start practice → no ring and no lives, guesses resolve, wait well past 15s with no life lost, name all 11 → the Practice summary → the profile history is unchanged.
  - **Mock, Free, switch on:** the locked checkbox; `?practice=1` by URL shows the locked gate.
  - **Mock:** practice from an archive row plays that match.
  - **Real, Pro:** the same run; the backend saves nothing (the history and `GET /solo/allowance` are unchanged after it).
  - **Real, `PRO_ENABLED=false`:** a fresh guest practises.
