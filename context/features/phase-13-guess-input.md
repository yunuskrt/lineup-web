# Phase W13 — Guess Input

## Status

Completed

## Goals

- Add `inputShake: 240` to `MOTION_DURATION_MS` in `src/styles/motion.ts`, per `theme.md` § States ("Shake 240ms").
- Create `src/lib/guess.ts`, pure and framework-free. `prepareGuess(raw)` runs `guessTextSchema.safeParse` and returns the trimmed guess, or `null` when it's blank or over `MAX_GUESS_LENGTH`.
  - It never normalises, lowercases or strips accents. Matching is the server's job, so the typed text is sent as written, apart from the trim.
- Create `src/lib/guess.test.ts` covering:
  - trimming, and blank or whitespace-only input giving `null`;
  - the 64-character limit (64 passes, 65 is `null`);
  - accents and Turkish letters passing through unchanged (`'İbrahimović'`, `'Şahin'`);
  - apostrophes and hyphens kept as typed.
- Create `src/components/game/GuessInput.tsx`, a client component driven by props only. It exports its `GuessInputStatus` type (`'live' | 'pending' | 'locked'`). Props:
  - `status`;
  - `value` and `onValueChange(value)`, so it's controlled and the parent decides when to clear or keep the text;
  - `onSubmit(guess)`, called only with the result of `prepareGuess`, and only when `status === 'live'`;
  - `shakeKey: number`, which shakes the input whenever it changes but not on mount (the `LifeLostFlash` `flashKey` pattern).
- Structure of `GuessInput`:
  - A `<form>` with a visible label "Guess a player" and an `aria-hidden` hint "Press Enter ↵".
  - One `<input type="text">`: placeholder "Name a player…", `maxLength={MAX_GUESS_LENGTH}`, `enterKeyHint="send"`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck={false}` and `text-16`. At 16px iOS Safari doesn't zoom on focus.
  - There's no submit button; Enter submits.
- Status treatment, all colours from role utilities:
  - `live`: `border-you` plus `FOCUS_RING`, editable.
  - `pending`: `readOnly`, `aria-busy`, muted text, and a 16px spinner inside the input on the right, with sr-only text "Checking".
  - `locked`: `readOnly`, `aria-disabled`, dim text, `border-line`, and no spinner.
- `pending` and `locked` use `readOnly`, not `disabled`, so focus and the phone keyboard survive the round trip. Submitting is refused unless the status is `live`.
- Focus: the input is focused on mount when `live`, and again on every change into `live`. That's the only effect in the component.
- Spinner: a local component in the same file. An SVG arc is rotated by Motion (`rotate`, `repeat: Infinity`, `ease: 'linear'`), with no CSS `@keyframes`.
- Shake: a Motion `x` keyframe on the wrapper (`[0, -6, 6, -4, 4, 0]` over `inputShake`). The border shifts to `border-danger` for the same 240ms through a named `border-color` inline transition. Motion never touches `border-color`, and CSS never touches `x`.
- Create a dev route at `src/app/dev/guess/page.tsx`: a server page with the `notFound()` guard, like `/dev/reveal`. It renders the client component `src/components/dev/GuessPreview.tsx`:
  - A live `GuessInput` in a phone-width column.
  - A "Next outcome" toggle: correct new, already found, or not in XI.
  - Submitting goes to `pending` for about 600ms, then applies the chosen outcome's input treatment:
    - correct new clears the text and locks, then returns to `live` after a beat;
    - already found clears the text and stays live;
    - not in XI keeps the text and shakes.
  - Buttons force `live`, `pending` and `locked`, plus "Shake".
  - A read-out of the last submitted guess, showing exactly what `onSubmit` received.
  - It never imports from `src/lib/api/mock/`, and the outcome is picked by hand, never computed from the text.

## States

| State         | Trigger (supplied by W14, W16, W20, W23) | Input                                      | Text                            |
| ------------- | ---------------------------------------- | ------------------------------------------ | ------------------------------- |
| Live          | Your round starts                        | Focused, editable, `you` border            | Empty or as typed               |
| Pending       | Guess submitted, awaiting the server     | Read-only, 16px spinner inline, `aria-busy` | Kept, muted                     |
| Correct, new  | Server confirms an unfound player        | Parent sets `locked`                       | Parent clears                   |
| Already found | Name is in the found-pool                | Parent sets `live`                         | Parent clears                   |
| Not in XI     | Name isn't in the squad                  | Parent sets `live` and bumps `shakeKey`    | Kept, caret at the end          |
| Life lost     | Timer hits 0                             | Parent sets `locked`                       | Kept                            |
| Their turn    | Handover                                 | Not rendered; the canvas hides it          | —                               |
| Reduced motion | `prefers-reduced-motion: reduce`        | No shake; the `danger` border tint remains | Unchanged                       |

- **Server-pushed only.** The input never decides an outcome. It trims and length-checks as a convenience, sends the text and renders the status it's given. The ring keeps sweeping while pending; the input doesn't touch it.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **`readOnly` rather than `disabled` for pending and locked:** default is `readOnly`, with `aria-disabled` when locked. A disabled input drops focus and collapses the phone keyboard, so the layout jumps mid-round and the next round starts unfocused. The alternative is `disabled` plus a refocus.
- **Focus on mount:** default is yes, when mounted `live`. On a phone that raises the keyboard as the round starts, which matches `theme.md`'s "Focused, live". The alternative is focusing only on changes into `live`, not on the first mount.
- **Spinner under reduced motion:** default is to keep it spinning. It carries information (the guess is in flight), like the ring. The alternative is a static glyph with the opacity pulse from `SKELETON_PULSE_OPACITY`.
- **Shake distance:** default is ±6px, damped to ±4px, over 240ms. Record the values used.
- **Rejection tint:** default is a `danger` border for 240ms alongside the shake. It keeps the not-in-XI channel visible when reduced motion drops the shake. Drop the tint if it reads as an error state.

## Out of Scope

- **Toasts** ("Already named", "Not in this XI") and the **grid pulse** → W14.
- **Deciding which outcome** clears, keeps or shakes. W13 only exposes the props; W14 and W20 map server results onto them.
- **Hiding on their turn**, and placing the input thumb-side on phones → W16 and W23.
- **Rate-limited lock with a reason** → W25.
- **Calling `api.solo.guess` or `duel.guess`** → W20 and W23.
- **Screen-reader announcements** of outcomes → W14 and W26.

## Notes

- Scope: the guess input as a standalone, props-driven component with its three statuses, the not-in-XI shake and the inline spinner. Also a tested guess-preparation helper and a dev preview.
- Depends on:
  - W02a: `MOTION_DURATION_MS` and `src/styles/motion.ts`.
  - W03: the role utilities.
  - W05a: `guessTextSchema` and `MAX_GUESS_LENGTH`.
  - W11: the `flashKey` trigger, reduced-motion and dev-preview patterns.
- References:
  - `context/theme.md` § States: the Input column of "Duel — your turn", and "Inline (guess submitted)" under Loading.
  - `context/design.md` § One primary action per view, where the input is a round's single action.
  - `context/screenshots/game-screen-prototype.png`, for the label, the amber border and the "Press Enter" hint.
- Constraints:
  - **No game logic.** The client never judges a guess. `prepareGuess` is the `guessTextSchema` boundary check, a convenience the backend repeats. No normalising or matching runs on the client.
  - **Never fail silently.** A submit while not `live` is refused visibly: the input is read-only and shows why (spinner or dim), rather than swallowing keystrokes.
  - **Transform and opacity only.** The shake is Motion `x`, and the spinner is Motion `rotate`. Only `border-color` uses a CSS transition, which Motion never animates.
  - **Reduced motion is a scalpel.** Only the shake checks `useReducedMotion()`. Vary the transition or variant rather than `initial`, per the W11 hydration lesson.
  - **Colours from tokens only**, through role utilities: `border-you`, `border-line`, `border-danger`, `text-fg`, `text-fg-muted`, `text-fg-dim` and `bg-surface-card`. No hex.
  - **Tight corners:** `rounded-sm`, the input radius from `theme.md` § Form. No pill shape.
  - `@/` imports only, and typed props. Comments only for the non-obvious.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/guess`, and `src/lib/guess.test.ts` passes.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/guess`:
    - The input is focused on load.
    - Typing "  Rhys Harlow  " and pressing Enter shows "Rhys Harlow" in the read-out, with a spinner inside the input while pending.
    - Enter while pending does nothing, and nothing is submitted twice.
    - Enter on blank input submits nothing.
    - "Correct new" clears and locks; "Already found" clears and stays live; "Not in XI" keeps the text and shakes with a red border.
    - Sampling in Playwright shows only `transform` changing on the wrapper, settling within about 240ms.
    - With `prefers-reduced-motion: reduce` emulated before load, there's no shake but the red border remains, and the console shows no hydration warnings.
    - At 375px there's no horizontal scroll and the spinner doesn't overlap long text.
    - The accessibility tree names the field "Guess a player", and reports it busy while pending.
- **Deviations recorded during implementation**
  - **Rejection tint is an overlay, not a `border-color` transition:** a 2px `border-danger` span keyed by `shakeKey` fades out on Motion opacity, following the `LifeLostFlash` pattern. No state or timer is needed to clear it, and it stays mounted at 0 afterwards. The 1px border tried first barely showed over the amber border.
  - **Two effects, not one:** the shake runs `useAnimate` in an effect, and a ref records the last `shakeKey` handled. Replaying keyframes on a prop change without remounting the input (which would lose focus) needs an imperative call. The focus effect is as specified.
  - **Focus ring for the inert statuses:** pending and locked get a `focus-visible` outline in `fg-dim`, because the input keeps focus. Without it the browser's default blue ring, which isn't a token, showed.
  - **`SubmitEvent`** replaces `FormEvent`, which the current React types deprecate.
  - **Values used:**
    - Shake: x `[0, -6, 6, -4, 4, 0]` over 240ms, settling in about 250ms when sampled.
    - Tint: opacity `[1, 1, 0]`, times `[0, 0.5, 1]`, `easeIn`, over 240ms.
    - Spinner: 0.8s per turn, linear.
    - Preview: 600ms server delay, and 900ms before the next round.
  - **Reduced motion:** as defaulted. The shake is skipped; the tint and the spinner are kept.
  - **The preview read-out wraps** (`whitespace-pre-wrap`, `break-all`). A long guess otherwise overflowed the page at 375px. The input itself scrolls its text internally.

## History
