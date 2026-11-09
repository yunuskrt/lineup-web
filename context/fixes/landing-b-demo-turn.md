# Fix — Landing B: Demo Turn

## Status

Completed

## Goals

- **The showcase still frame from Landing A plays one solo turn on a loop:** names typed, suggestions, reveals, one wrong guess, and the ring sweeping. It is the one moving thing on `/` (`context/docs/landing-page-improvements.md` § 4). **Needs:** Landing A merged.
- **The timeline is data, not logic.**
  - A pure `demoTimeline(showcase)` in `src/lib/landing-demo.ts` turns `showcase.demo` into a list of timed steps.
  - A pure `demoFrameAt(timeline, elapsedMs)` returns what to draw at that moment: the input text, the suggestion row, pending or shake, the filled slots, the toast, and the ring's round.
  - **No matcher, no lives, no outcome is decided.** The reveals and the miss come from the response; the client only plays them back.
- **One loop** (about 26 seconds):
  1. **Start:** the header and empty formation, with the ring full. 1.2s.
  2. **Each reveal** in `demo.reveals` order (5 today: Bale, Cristiano Ronaldo, Benzema, Modrić, Kroos), about 3.5s each:
     - The last word of the name is typed, 3 letters at about 110ms each ("Bal").
     - The suggestion row shows that player, with photo and name, as `SuggestionList` draws it.
     - The row is picked and the input fills with the full name.
     - **Pending** for 300ms, with the inline spinner.
     - **The reveal:** the slot fills with the turf flash, and `RevealCard`'s 320ms spring plays.
     - **The ring resets**, because in solo a new name starts the next round at once.
  3. **The miss** (if `demo.miss` is set), after the second reveal, the same way: type "Mes", the row shows Lionel Messi, pick, pending, then the input **shakes** and the "Not in this XI" toast shows. The ring keeps sweeping, so the next reveal lands in the same round.
  4. **Hold:** 3s on the filled grid, with "5 of 11 named" in the caption's place.
  5. **Fade** (240ms) back to step 1.
  - The ring is `CountdownRing`, fed a `RoundTiming` the demo builds on the page clock. It sweeps **linearly at the real 15-second rate**. No round lasts more than about 7s, so the demo never shows a life lost.
  - Exact step lengths are tuned in the browser and recorded under Notes.
- **Reuse, don't fork:** `MatchHeader`, `SquadGrid`, `RevealCard`, `CountdownRing`, `GuessInput` (read-only value, `pending` status, `shakeKey`) and `FeedbackToast`. Where a component needs a prop to be driven, add the smallest one (for example a `readOnly` on `GuessInput`), never a copy.
- **Pause:**
  - A visible Pause / Play button in the demo's top corner, styled like `QUIT_CHIP`. It is the only focusable thing in the demo (WCAG 2.2.2). Its label follows its state ("Pause demo" / "Play demo").
  - The rest of the stage stays `inert` and `aria-hidden`, as in A.
- **Runs only when seen:**
  - It starts the first time it is at least half in view (`IntersectionObserver`).
  - It pauses while out of view and while the tab is hidden (`visibilitychange`), and resumes where it was.
  - A pause the user chose stays until they press Play.
- **No sound:** the demo never mounts `useGameSounds` or the cue engine.
- **Reduced motion:** Landing A's still frame, with no timeline, no typing and no Pause button (nothing moves). The ring stops here, unlike in play, because in the demo it carries no information (`theme.md` gains this rule under Docs).
- **Motion:**
  - `transform` and `opacity` only. Durations come from `motion.ts`; new ones are added there (`demoTypeStep`, `demoPending`, `demoHold`), with `motion.test.ts` extended.
  - Every new effect reads `useMotionPolicy`.
- **Performance:**
  - **The demo stays out of the first paint:** the fold's `<h1>` is the LCP element.
  - The timeline runs on one `requestAnimationFrame` loop that stops while paused or out of view, never one timer per step.
  - The headshots are the bucket's 128px WebP.
- **Dev:** `/dev/landing` gains:
  - `demo` (the loop);
  - `demo-paused`;
  - `?at=<ms>`, which freezes the frame at a moment, for snapshots of each step.
- **Tests:**
  - `demoTimeline`: 5 reveals plus a miss give the steps in order; no miss means no shake step; the loop length is the sum of its steps.
  - `demoFrameAt`: at a moment inside each step it returns that step's text, filled slots, pending, shake or toast; no round lasts longer than 15s; after the hold it wraps back to the start.
- **Docs:**
  - `context/theme.md` § States: a "Landing demo" row, covering the still frame under reduced motion, the ring that stops, the Pause button and no sound.
  - `context/docs/landing-page-improvements.md` § 4: record the tuned step lengths.

## Out of Scope

- Any interaction with the demo besides Pause: it can't be typed into or clicked into a game.
- Sound on `/`.
- The real Real Madrid XI: that arrives with Landing C. B runs on the mock's fictional showcase.

## Open Questions

Defaults stand unless changed at load:

- **What's typed** is the first 3 letters of the name's last word. A name whose last word is short or shared (Marcelo, Casemiro: one word) types its first 3 letters.
- **The miss goes after the second reveal.**

## Notes

- **Deviations recorded during implementation:**
  - **No "5 of 11 named" caption during the hold:** the match header already counts "5/11" and the caption keeps naming the match. Swapping a visible caption under a figure for 3s added motion without information.
  - **The Pause / Play chip sits in the caption row,** right of the caption, not in the demo's top corner: the top-right corner is the header's "N/11" count.
  - **The chip's visible text is "Pause" / "Play"** (uppercase, `QUIT_CHIP`); its accessible name is "Pause demo" / "Play demo".
  - **`GuessInput` gains `drivenHighlight?: string | null`,** not `readOnly`: the list opened only on focus, and the demo's input is inert. When it is set, the input also skips its focus call and its scroll-into-view, so the demo can never move focus or scroll the page (checked: scrollY stays 0 over 9s of play).
  - **A `demoLoop` motion effect** (`drop`) decides demo vs still frame, so the choice reads `useMotionPolicy` like every other effect. The step lengths are ten `demo*` entries in `MOTION_DURATION_MS`, not three.
  - **The toast sits above the input** in the band, as in the game's rail, so the still frame and the demo share one height.
  - **Only the header and pitch fade** at the loop's end, not the whole panel, so its border doesn't flicker.
  - **The ring is driven by its round's start, not re-rendered per frame:** one `requestAnimationFrame` loop updates React only when the frame changes (about 40 times a loop); `CountdownRing` keeps its own sweep, and in `frozen` mode holds the paused moment.
  - **Dev states:** `ready` is the playing demo (no separate `demo`), plus `demo-paused`, `still` (the reduced-motion frame) and `&at=<ms>`. In an `at` snapshot the toast replays on mount; live, it shows once per loop.
  - **Loop length** 24.97s, not about 26s (the step lengths above).
  - **The ring runs only once a run's clock is set:** on resume the ring stays frozen until the first frame tick sets the new start, so it never shows one frame of "time lost while paused" (checked: 13 held through a 4s pause, then 13 → 12). `ShowcasePlayback` lives in `src/types/landing.ts`, so `src/lib/dev` doesn't import a component.
- **Source:** user request (2026-11-09): the demo on Real Madrid's 2017 XI with Bale, Cristiano Ronaldo, Benzema, Modrić and Kroos; Lionel Messi as the wrong guess; a fictional XI on the mock.
- **Order:** after Landing A, before Landing C. Backend R7 can be built in parallel.
