# Phase W15 — Skeletons & Overlays

## Status

Not Started

## Goals

- Add `gateFade: 240` to `MOTION_DURATION_MS` in `src/styles/motion.ts`. `skeletonPulse` (1600) and `SKELETON_PULSE_OPACITY` already exist from W02a and are used as they are.
- Add component tokens to `src/styles/theme.css`, and expose them in `src/app/globals.css` `@theme`. No hex, and no new primitive:
  - `--skeleton-fill: var(--surface-card)`, which is `pitch-800` per `theme.md` § Loading;
  - `--gate-scrim: color-mix(in oklch, var(--surface) 72%, transparent)`, a dim layer that leaves the canvas readable.
- Update `src/components/pitch/SquadSlot.tsx`, which stays server-safe. It gains a `loading` state: the same `SLOT_BOX` filled with `bg-skeleton-fill`, with no border colour change, no text and `aria-hidden`. Loading, empty and filled slots are identical boxes.
- Update `src/components/pitch/SquadGrid.tsx`:
  - It takes `isLoading?: boolean`. While it's true, every point in the layout renders a `loading` slot, and `revealed` is ignored.
  - The slot layer (`ol`) pulses its opacity through `SKELETON_PULSE_OPACITY` over `skeletonPulse`, `easeInOut`, on repeat. Reduced motion holds it still at 1. Nothing else pulses, and there's no shimmer.
  - The pitch stays drawn. The grid gets `aria-busy` and an sr-only "Loading squad".
  - **Snapshot on arrival:** the players present when `isLoading` turns false render settled, not as new reveals. The prev-prop comparison also tracks `isLoading`, so the baseline is reset at that moment.
  - The formation can change as loading ends. The slots already move to their new places on Motion `x` / `y` (W09), so a placeholder formation becomes the real one without a jump.
- Export `LOADING_FORMATION = '4-4-2'` from `src/lib/formation.ts`, for callers that don't know the formation yet.
- Create `src/components/game/CanvasGate.tsx`, a client component that dims the canvas without hiding it (`design.md` § Gate the canvas):
  - Props: `isOpen: boolean`, `title: string`, `detail?: string`, `action?: ReactNode` and `children` (the canvas).
  - Children always render. While open they get `inert`, so they can't be clicked, focused or read out of order, but stay visible.
  - A `bg-gate-scrim` layer (`absolute inset-0`) sits over them, with a centred panel: `bg-surface-raised`, `border-line`, `rounded-lg`, the title in `text-16 font-semibold`, the detail in `text-14 text-fg-muted`, then the action.
  - The scrim and panel fade in and out on opacity over `gateFade` through `AnimatePresence`. Only opacity animates; the canvas itself is never faded or scaled.
  - The title sits in a polite live region, so a screen reader announces why the canvas is gated. When the gate opens, focus moves to the panel's action if there is one, and otherwise to the panel.
- Create a dev route at `src/app/dev/loading/page.tsx`: a server page with the `notFound()` guard, like `/dev/feedback`. It renders the client component `src/components/dev/LoadingPreview.tsx`:
  - A `SquadGrid` in a phone-width frame with a loading toggle and a formation choice (`4-4-2`, `3-5-2`, `4-3-3`).
  - "Finish loading with 4 revealed" ends loading on `3-5-2` with four players, so it shows both the formation move and a settled snapshot.
  - Gate samples over the same grid, opened by buttons:
    - Matchmaking: "Finding an opponent", with a Cancel action.
    - Reconnecting: "Reconnecting, 18s", with the detail "Your clock is still running".
    - Pre-match: "Match ready", with a Start action.
  - Close closes the gate. A counter shows that clicks on the gated grid do nothing.
  - It never imports from `src/lib/api/mock/`.

## States

| Surface       | Trigger (supplied by W16, W20, W22, W25) | Treatment                                                                              |
| ------------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| Grid loading  | Session or squad being fetched           | Pitch drawn, 11 `skeleton-fill` slots in formation, slot layer pulsing `1 → 0.6 → 1`   |
| Grid arrives  | Loading ends                             | Same boxes, now empty or filled. Players already found render settled, with no spring  |
| Gated         | Pre-match, matchmaking, reconnecting     | Grid visible under a scrim, inert. Panel with reason, optional detail and one action   |
| Reduced motion | `prefers-reduced-motion: reduce`        | No skeleton pulse. The gate still fades, which is opacity only and carries meaning     |

- **Server-pushed only.** Neither component decides when loading ends or why the canvas is gated. Both render the props they're given.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Match header and lobby row skeletons:** `theme.md` § Loading lists them, but neither component exists yet (the match header is W16, lobby rows are W22). A skeleton has to match its final layout exactly, and one built ahead of the real component can't be checked against it. Default: defer both to the phases that build them, and record it. The alternative is to build them now at fixed heights, which those phases then have to match.
- **Scrim strength:** default is 72% `surface` over the canvas. The grid stays legible but clearly inert. Record the value used.
- **Gate focus:** default is to move focus into the panel when it opens, and not to trap it. With the canvas `inert`, the only focusable things left are the panel and the page outside the canvas, which is the quit chip on game routes. The alternative is a full focus trap.
- **Placeholder formation:** default is `4-4-2` while the real one is unknown, then Motion moves the slots into place. The alternative is to show no slots until the formation is known, which contradicts `theme.md`'s "11 slot shapes".
- **Pulse under reduced motion:** default is off (held at full opacity). The pulse is decoration, and the skeleton still reads as loading from its shape.

## Out of Scope

- **Match header and lobby row skeletons** → W16 and W22 (see Open Questions).
- **The inline guess spinner:** already built in W13.
- **Wiring:** when to show loading or a gate, and what the reconnect countdown says → W16, W20, W22 and W25.
- **Full-screen system states** (protocol refused, connection lost) → W25. Those replace the page, not gate the canvas.

## Notes

- Scope: the squad grid's loading state (shape-matched skeleton slots, a calm pulse and a settled snapshot on arrival), a reusable canvas gate overlay, and a dev preview for both.
- Depends on:
  - W02a: `skeletonPulse` and `SKELETON_PULSE_OPACITY`.
  - W09: `SquadGrid`, `SquadSlot`, `slotLayout` and Motion slot positioning.
  - W12: the `newIds` prev-prop pattern this phase extends.
- References:
  - `context/theme.md` § Loading (skeletons, no shimmer, the optional pulse, skeleton equals final layout).
  - `context/design.md` § Gate the canvas, don't hide it, and § Every wait has a known shape.
- Constraints:
  - **Identical space.** Loading, empty and filled slots are the same box, and the grid's outer size never changes, so nothing shifts when the squad arrives.
  - **No shimmer, and no spinner on a panel.** The only spinner in the app stays inside the guess input.
  - **Transform and opacity only.** The pulse and the gate fade are opacity; slot moves are Motion `x` / `y`. No CSS transition shares a property with Motion.
  - **Reduced motion is a scalpel.** Only the skeleton pulse checks `useReducedMotion()`. Vary the transition rather than `initial`, per the W11 hydration lesson.
  - **Colours from tokens only**, through role utilities and the two new component tokens. No hex.
  - `SquadSlot` stays a server component. `@/` imports only, typed props, and comments at most 50 characters, only for the non-obvious.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/loading`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/loading`:
    - Loading shows 11 filled blocks in formation over the drawn pitch, pulsing between opacity 1 and 0.6 over about 1.6s.
    - The bounding boxes of a loading slot, an empty slot and a filled slot are identical, and so is the grid's box before and after loading.
    - "Finish loading with 4 revealed" moves the slots into `3-5-2` and shows four settled cards with no spring or flash.
    - Each gate sample dims the grid without hiding it. Clicking the grid does nothing, and Tab doesn't reach anything inside it. The title is announced from a live region, and focus lands on the action.
    - Closing the gate restores clicks and focus on the grid.
    - With `prefers-reduced-motion: reduce` emulated before load, the skeleton doesn't pulse, and the console shows no hydration warnings.
    - At 375px the gate panel fits inside the grid frame, and there's no horizontal scroll.
  - `/dev/pitch`, `/dev/reveal` and `/dev/feedback` are unchanged.
- **Deviations recorded during implementation**
  - **The gate manages focus beyond opening:** a layout effect records what had focus before the canvas turns inert.
    - It moves focus into the panel on open, and again if focus is lost while open, for example when the reason changes and its action unmounts.
    - On close, it hands focus back to the earlier element if focus was left in the panel or on `body`.
    - The goal only asked for focus on open. Checking it showed focus stranded on `body` after a reason switch and after closing.
  - **The live region is persistent:** a sr-only `role="status"` sits outside `AnimatePresence`, and its text is set while open. A region mounted together with its content isn't reliably announced. The visible title is `aria-hidden`, and the panel is a `group` labelled by the title.
  - **The loading slot's border matches its fill** (`border-skeleton-fill`), so the block reads flat while keeping the same 1px border box as empty and filled slots.
  - **The pulse settles back to 1 over 200ms** when loading ends, instead of stopping mid-fade.
  - **Values used:**
    - Scrim: 72% `surface`.
    - Gate fade: 240ms, `easeOut`, on opacity.
    - Panel: at most 256px wide (`max-w-64`), and it fits a 375px frame.
  - **The match header and lobby row skeletons are deferred** to W16 and W22, as defaulted.
  - **The preview puts `GuessInput` inside the gated canvas,** so the checks prove the canvas is inert: gated clicks aren't counted, and Tab never lands inside it.
  - **Review fixes:**
    - **The exiting gate panel is inert:** an inner `GatePanel` reads Motion's `useIsPresent()` and sets `inert` during the 240ms fade-out, so a double click can't fire the action twice. Checked: 1 of 2 rapid clicks counted, and focus still returns to the input.
    - **`SquadGrid` slot branch extracted** into a local `GridSlot` (loading, card or empty). There's no change in behaviour: `/dev/pitch`, `/dev/reveal` and `/dev/feedback` were re-checked.
    - **Carried from W13 and W14:**
      - The `GuessInput` focus-ring comment is cut to 46 characters.
      - The "Press Enter ↵" hint is `text-fg-muted`, because `dim` is limited to large text.
      - `ToastMessage` and `GridPulse` now live in `src/types/feedback.ts`, instead of being written out in three files.
  - **Note for W25:** a countdown in the gate `title` ("Reconnecting, 18s") would be re-announced every second through the polite region. Keep the title stable, and put the countdown in `detail`.

## History
