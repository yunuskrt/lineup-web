# Phase W14 — Feedback Channels

## Status

Not Started

## Goals

- Add `alreadyFoundPulse: 480` and `toastVisible: 1600` to `MOTION_DURATION_MS` in `src/styles/motion.ts`.
- Add the component token `--already-found-pulse: var(--fg-muted)` to `src/styles/theme.css`, and expose it in `src/app/globals.css` `@theme` as `--color-already-found-pulse`. No hex, and no new primitive.
- Create `src/types/feedback.ts` with the type `GuessFeedback = { toast: string | null; clearInput: boolean; shakeInput: boolean; pulsePlayerId: string | null }`.
- Create `src/lib/feedback.ts`, pure and framework-free:
  - `FEEDBACK_MESSAGES`: `alreadyFound: 'Already named'` and `notInXi: 'Not in this XI'`, the copy from `theme.md` § States.
  - `guessFeedback(result: GuessResult): GuessFeedback` maps a server verdict onto the channels:
    - `correct_new`: no toast, clear the input, no shake, no pulse. The reveal is the feedback.
    - `already_found`: toast "Already named", clear the input, no shake, pulse `result.playerId`.
    - `not_in_xi`: toast "Not in this XI", keep the text, shake, no pulse.
  - It's an exhaustive `switch` with a `never` check, so a new outcome in the contract fails to compile here.
  - It says nothing about `live` or `locked`. The next input status depends on the mode (solo keeps going, duel hands over), which stays with W20 and W23.
- Create `src/lib/feedback.test.ts` covering each outcome's full `GuessFeedback`, that the two no-penalty outcomes never share a channel (pulse xor shake), and that `correct_new` produces no toast.
- Create `src/components/game/FeedbackToast.tsx`, a client component driven by props:
  - Props: `toast: { id: number; message: string } | null`.
  - A fixed-height row (`h-8`) is always rendered, with `role="status"` (polite), so the layout never shifts when a toast arrives and screen readers announce each message.
  - The message is a keyed `motion.p` (keyed by `id`) with `text-14`, `text-fg`, `bg-surface-raised`, a `border-line` border and `rounded-sm`. There's one slot: a new toast replaces the old one immediately.
  - Motion runs opacity `[0, 1, 1, 0]` over `toastVisible`, with a small `y` rise on entry. It stays mounted at opacity 0 afterwards. No timer and no dismissal state.
  - Reduced motion drops the `y` rise; the fade stays.
- Update `src/components/pitch/RevealCard.tsx` to take `pulseKey?: number`. When it changes after mount (the `LifeLostFlash` pattern), a keyed overlay plays once:
  - `absolute inset-0`, a `border-2 border-already-found-pulse` ring plus a faint `bg-already-found-pulse` fill;
  - opacity `[0, 1, 0]` over `alreadyFoundPulse`, peaking at 0.5 for the fill and 1 for the ring, painted under the text through the existing `backdrop` slot, alongside the reveal flash.
  - Opacity only. No scale: the wrapper's `scale` belongs to the reveal spring, and the two must not fight.
- Update `src/components/pitch/SquadGrid.tsx` to take `pulse?: { playerId: string; key: number }` and pass `pulseKey` to the card whose player matches. An id that isn't on the grid is ignored; the toast still tells the player.
- Create a dev route at `src/app/dev/feedback/page.tsx`: a server page with the `notFound()` guard, like `/dev/guess`. It renders the client component `src/components/dev/FeedbackPreview.tsx`:
  - A `SquadGrid` (4-4-2) with four inline sample players revealed, then `FeedbackToast`, then `GuessInput`, stacked like the phone layout in `context/screenshots/game-screen-prototype.png`.
  - A "Next outcome" toggle: correct new, already found or not in XI. Typing and pressing Enter goes to `pending` for about 400ms, then runs the chosen verdict through `guessFeedback` and applies it: toast, clear or keep, shake, pulse. Correct new also reveals the next sample player.
  - "Already found" picks the next revealed sample player in turn, so the pulse visibly moves around the grid.
  - It never imports from `src/lib/api/mock/`, and the verdict is picked by hand, never computed from the text.

## Channels

| Outcome       | Grid                                 | Input                          | Toast              | Ring and timer  |
| ------------- | ------------------------------------ | ------------------------------ | ------------------ | --------------- |
| Correct, new  | Slot fills (W12)                     | Clears                         | None               | Parent decides  |
| Already found | **That player's slot pulses, muted** | Clears, stays live             | "Already named"    | Keeps sweeping  |
| Not in XI     | **Unchanged**                        | **Shakes 240ms, text stays**   | "Not in this XI"   | Keeps sweeping  |

- **Already-found speaks through the grid; not-in-XI speaks through the input** (`theme.md` § States). The two never share a channel, and the toast names the outcome in words for both.
- **Server-pushed only.** `guessFeedback` maps a verdict the server already gave. It never checks a name against the grid, and the pulse target is the server's `playerId`.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Toast implementation:** default is a bespoke single-slot toast. The stack names shadcn/ui for toasts, but shadcn isn't set up in this repo, and a game-route toast needs to sit by the input with a reserved height, not stack in a screen corner. The alternative is to set up shadcn and use Sonner, anchored to a container. Revisit when W18 or W19 needs a general-purpose toast.
- **Toast placement:** default is directly above the input, where the eye already is. The alternative is overlaying the top of the canvas.
- **Toast tone:** default is neutral for both messages. Colour isn't needed because the channels already differ. The alternative is a `danger` edge for not-in-XI.
- **Pulse duration and look:** default is 480ms, a `fg-muted` ring plus a faint fill, once. `theme.md` names no duration; record the values used.
- **Toast duration:** default is 1600ms visible, shorter than a tenth of the round so it never lingers into the next guess.

## Out of Scope

- **Wiring to real results** (`api.solo.guess`, `guessResolved`) → W20 and W23.
- **The canvas layout** that places the grid, toast and input → W16.
- **Next input status** after an outcome (`live` or `locked`) → W20 and W23.
- **Announcing correct reveals** to screen readers → W26.
- **Rate-limited and error toasts** → W25.

## Notes

- Scope: the two no-penalty feedback channels (the grid pulse and the input shake), their toasts, the pure verdict-to-channel mapping with tests, and a dev preview that composes them.
- Depends on:
  - W05a: `GuessResult` and its `already_found.playerId`.
  - W12: `RevealCard`'s `backdrop` flash and `SquadGrid`'s prev-prop pattern.
  - W13: `GuessInput` with `shakeKey`, and the keyed-overlay pattern.
- References:
  - `context/theme.md` § States ("Duel — your turn": Already found and Not in XI, and the channel-split note), § Motion (transform and opacity only).
  - `context/design.md` § Token architecture, for the component-named token.
- Constraints:
  - **No game logic.** The client doesn't decide whether a name is already found or in the XI. It renders the verdict it's given.
  - **Never fail silently.** Every non-correct verdict produces a toast, even if the pulse target is missing from the grid.
  - **Transform and opacity only.** The pulse and toast animate opacity (plus the toast's `y`). No `background-color`, `border-color` or layout properties are animated, and no CSS transition shares a property with Motion.
  - **Reduced motion is a scalpel.** Only the toast's `y` rise checks `useReducedMotion()`. The pulse and fades are information and stay.
  - **Identical box.** The pulse draws inside the existing slot. The toast row is always reserved, so nothing shifts.
  - **Colours from tokens only**, through role utilities and the new `already-found-pulse` token. No hex.
  - `@/` imports only, and typed props. Comments at most 50 characters, and only for the non-obvious.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/feedback`, and `src/lib/feedback.test.ts` passes.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/feedback`:
    - "Already found" clears the input, pulses the named player's slot once in muted, and shows "Already named". The input doesn't shake.
    - "Not in XI" keeps the text, shakes the input, and shows "Not in this XI". No slot pulses.
    - "Correct new" reveals the next player with the W12 spring and flash, and shows no toast.
    - Two verdicts in quick succession: the second toast replaces the first, and the second pulse restarts.
    - Sampling in Playwright shows only `opacity` changing on the pulse overlay and toast (plus the toast's `transform`), and the toast row's height never changes.
    - With `prefers-reduced-motion: reduce` emulated before load, the toast fades without rising, and the pulse still shows. The console shows no hydration warnings.
    - The accessibility tree has a status region, and its text becomes "Already named" or "Not in this XI".
    - At 375px there's no horizontal scroll.
  - `/dev/reveal` and `/dev/pitch` are unchanged.
- **Deviations recorded during implementation**
  - **The toast unmounts when its fade ends:** `onAnimationComplete` records the finished `id`, and the message stops rendering, so faded text doesn't linger in the status region for screen readers. It's one piece of state and no timer, instead of the goal's "no dismissal state". Motion's `transitionEnd: { visibility: 'hidden' }` was tried first, and it never applied after the keyframed opacity.
  - **One pulse overlay, not two:** a `border-2` ring plus a `bg-already-found-pulse/50` fill (Tailwind's opacity modifier on the token) on a single span. One opacity animation gives the ring a peak of 1 and the fill a peak of 0.5. It stays mounted at 0 after playing, like the W12 flash.
  - **A verdict without a toast clears the old one:** the preview sets `toast` to `null` on `correct_new`, so a stale "Already named" never outlives a later correct answer. W20 and W23 should do the same.
  - **Values used:**
    - Pulse: opacity `[0, 1, 0]`, `easeInOut`, over 480ms.
    - Toast: opacity `[0, 1, 1, 0]`, times `[0, 0.1, 0.8, 1]`, `easeOut`, over 1600ms, with a 4px rise over 200ms. The rise is a local constant, not a theme timing.
  - **Tone and placement:** as defaulted. Both toasts are neutral, directly above the input, and the toast is bespoke rather than shadcn.

## History
