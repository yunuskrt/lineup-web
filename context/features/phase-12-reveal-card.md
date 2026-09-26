# Phase W12 — Reveal Card

## Status

Completed

## Goals

- Create `src/lib/initials.ts`, pure and framework-free:
  - `initials(name)` returns the uppercased first letter of the first word and of the last word (`'Jasper van der Linde'` → `'JL'`). A one-word name gives one letter (`'Tavinho'` → `'T'`).
  - Letters are taken as whole characters after NFC normalisation, so accents survive (`'Íñigo Castañeda'` → `'ÍC'`, `'Ciarán O'Donovan'` → `'CO'`).
  - A hyphenated last word counts as one word (`'Kofi Addo-Mensah'` → `'KA'`). Surrounding and repeated whitespace is ignored.
- Create `src/lib/initials.test.ts` covering those cases, plus a mononym, lowercase particles (`van der`, `de`), apostrophes, hyphens, Turkish and Latin Extended-A letters (`'İlkay Şahin'` → `'İŞ'`, `'Łukasz Čech'` → `'ŁČ'`), and extra whitespace.
- Add reveal colour tokens:
  - In `src/styles/theme.css`, add the component tokens `--reveal-flash-you: var(--found)` and `--reveal-flash-opponent`. The second is `away`-tinted `turf`, derived with `color-mix(in oklch, var(--found) 60%, var(--opponent))`.
  - In `src/app/globals.css`, expose both through `@theme` as `--color-reveal-flash-you` and `--color-reveal-flash-opponent`.
  - No hex, and no new primitive in `tokens.css`.
- Add the type `FoundPlayer = RevealedPlayer & { foundBy?: DuelActor }` to `src/types/player.ts`. `DuelFoundPlayer` and a plain `RevealedPlayer` both satisfy it, and a missing `foundBy` means `'you'` (solo).
- Update `src/components/pitch/SquadSlot.tsx`, which stays server-safe. The `filled` state gains a `foundBy: DuelActor` prop and an initials badge:
  - The badge sits in the label row, before the position label. It's `rounded-sm`, `text-12`, with `bg-you` or `bg-opponent` and `text-on-accent` text, and `aria-hidden`.
  - The slot's size is unchanged: filled and empty are still identical boxes.
  - The accessible text becomes "Defender, Rhys Harlow" in solo and "Defender, Rhys Harlow, named by you" / "…, named by your opponent" in a duel. The duel suffix is added only when the caller passes `foundBy`.
- Create `src/components/pitch/RevealCard.tsx`, a client component that wraps a filled `SquadSlot` and plays the reveal once:
  - Props: `player: FoundPlayer`, `position: PositionGroup` and `isNew: boolean`.
  - Spring in: scale 0.85 → 1 and opacity 0 → 1, as a Motion spring with `visualDuration` of `MOTION_DURATION_MS.reveal` (320ms) and type `REVEAL_TRANSITION_TYPE`.
  - Flash: an absolutely positioned overlay inside the card, `bg-reveal-flash-you` or `bg-reveal-flash-opponent`. Motion takes its opacity from a peak to 0, so the card settles to `bg-surface-card`. The background colour itself is never animated.
  - `isNew === false` renders the settled card with no animation.
- Update `src/components/pitch/SquadGrid.tsx`:
  - `revealed` becomes `FoundPlayer[]`.
  - Filled slots render through `RevealCard`.
  - A slot is "new" when its player id wasn't in the previous `revealed` prop. Compare with React's "store the previous prop in state" pattern, not an effect.
  - Everything revealed at first mount (a reconnect snapshot, or a resumed solo run) renders settled.
  - Several players arriving in one update all animate together.
- Create a dev route at `src/app/dev/reveal/page.tsx`: a server page with the `notFound()` guard, like `/dev/lives`. It renders the client component `src/components/dev/RevealPreview.tsx`:
  - a `SquadGrid` built from inline sample players, including _Christophe Delacroix-Morel_, _Íñigo Castañeda_ and a mononym, with a toggle between `4-4-2` and `3-5-2` (the five-wide line);
  - buttons "You reveal next", "Opponent reveals next", "Reveal two at once" and "Reset";
  - a "Mount with 4 revealed" button that remounts the grid, to show that a snapshot doesn't animate.
  - It never imports from `src/lib/api/mock/`.
- Leave `/dev/pitch` working. Its sample players don't carry `foundBy`, so they render as solo cards.

## States

| State                  | Trigger (supplied by W20 and W23)      | Card                                                                         | Badge            |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------- | ---------------- |
| Solo, correct new      | Server reveals a player                | Springs in over 320ms; `turf` flash fades out and settles to `surface-card`  | `you`            |
| Duel, your reveal      | `playerRevealed` with `foundBy: 'you'` | Same as solo                                                                 | `you`            |
| Duel, their reveal     | `foundBy: 'opponent'`                  | Same spring; flash in `away`-tinted `turf`                                   | `opponent`       |
| Snapshot / reconnect   | Grid mounts with players already found | Settled, no animation                                                        | Finder's colour  |
| Reduced motion         | `prefers-reduced-motion: reduce`       | No spring or scale; opacity fade-in and the colour flash are kept            | Unchanged        |
| Draw / full XI         | All 11 found                           | Settled cards; both badge colours present, so neither side dominates         | Mixed            |

- **Server-pushed only.** The grid reveals what `revealed` contains, when it contains it. It never decides that a guess was correct, never reveals a slot early and never holds the squad.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **One card, not two:** `theme.md` lists "Slot fills, `turf` flash" in the grid column and "Name card springs in" in the feedback column. Default: the filled slot _is_ the found-player card (`theme.md` § Signature components), and it both springs and flashes. There's no second floating card, because a second card would compete with the grid it describes.
- **Flash timing and peak:** default is an overlay peak of 0.4 opacity, holding for the spring, then fading to 0 over 640ms with `easeOut` (the whole cue is about 960ms). The peak stays below 1 so the `bone` name stays readable, since `theme.md` forbids `bone` on solid `turf`. Record the values used.
- **`away`-tinted turf:** default is a 60 / 40 `turf` / `away` mix in OKLCH, defined once as a component token. Tune by eye and record the ratio.
- **Spring bounce:** default `bounce: 0.25` with `visualDuration: 0.32`. The start scale is 0.85, because any lower overlaps neighbouring chips in five-wide lines.
- **Initials badge:** default is yes, as the prototype shows. It doubles as the duel finder mark, which is how a draw shows "both colours present". The fallback is a thin top edge in the finder's colour if the badge crowds five-wide lines at 375px.
- **`imageUrl`:** default is to ignore it in W12 and always show initials. The bucket and CDN are undecided (B23 / B24), `theme.md` flags image licensing, and every fixture has `null`. Images are revisited in W29.

## Out of Scope

- **The already-found pulse** on an existing slot → W14.
- **The loading skeleton** → W15.
- **Subscribing** to `playerRevealed` or solo guess results → W20 and W23. The grid takes props only.
- **Freezing the ring** on a correct answer → W16 and W20. The ring already supports `frozen`.
- **Screen-reader announcement** of a reveal ("Rhys Harlow, found") → W26.
- **The perfect-clear `turf` takeover** → W21.

## Notes

- Scope: the reveal moment on the squad grid, meaning spring, flash, initials badge and finder colour, plus a tested initials helper and a dev preview.
- Depends on:
  - W02a: `MOTION_DURATION_MS.reveal` and `REVEAL_TRANSITION_TYPE`.
  - W03: the role layer and `@theme`, where the new component tokens go.
  - W05: `RevealedPlayer` and `DuelFoundPlayer`.
  - W09: `SquadGrid`, `SquadSlot`, `slotLayout` and the chip sizing.
  - W11: the prev-prop-in-state and dev-preview patterns.
- References:
  - `context/theme.md` § Signature components (found-player card), § States (correct new, their reveal) and § Motion (reveal 320ms spring, transform and opacity only).
  - `context/design.md` § Token architecture, for component-named tokens.
  - `context/screenshots/game-screen-prototype.png`, for the initials badge on found slots.
- Constraints:
  - **No game logic.** The client never receives the squad. It reveals only players it has been given, and "new" is a render diff, not a ruling.
  - **Transform and opacity only.** The spring is `scale` plus `opacity`, and the flash is the overlay's `opacity`. Nothing animates `background-color`, `width`, `height`, `top` or `left`. Slot positioning stays on Motion `x` / `y` from W09.
  - **Motion and CSS never share a property.** There's no CSS transition on the card, the overlay or the wrapper.
  - **Reduced motion is a scalpel.** Only the spring's scale checks `useReducedMotion()`. The reveal itself (fade-in and flash) still shows. Don't branch `initial` on `useReducedMotion()`, which caused a hydration mismatch in W11; vary the transition instead.
  - **Identical box.** Filled and empty slots stay the same size, and the badge fits inside the existing label row.
  - **Colours from tokens only:** role utilities plus the two new `reveal-flash` component tokens. No hex. Text on `you` or `opponent` badges is `text-on-accent`.
  - **Names are never shortened.** The full name is shown, clamped to two lines, as in W09. The initials are decorative and `aria-hidden`.
  - `@/` imports only, and typed props. Comments only for the non-obvious. `SquadSlot` stays a server component; only `RevealCard` and `SquadGrid` are client components.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/reveal`, and `src/lib/initials.test.ts` passes.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/reveal`:
    - "You reveal next" fills one slot, which springs in and flashes `turf`, then settles to `surface-card` with an amber initials badge.
    - "Opponent reveals next" flashes the `away`-tinted `turf` and shows a blue badge.
    - "Reveal two at once" animates both slots together.
    - "Mount with 4 revealed" shows four settled cards with no animation.
    - Sampling the card's transform and the overlay's opacity (in Playwright) shows only `transform` and `opacity` changing, and the card settling within about 1s.
    - With `prefers-reduced-motion: reduce` emulated before load, there's no scale change, but the fade-in and flash remain. The console shows no hydration warnings.
    - At 375px, a five-wide line (switch the preview to `3-5-2`) fits badges and names without overlap, and there's no horizontal scroll.
    - The accessibility tree reads "Defender, Rhys Harlow, named by your opponent" for an opponent reveal.
  - `/dev/pitch` still renders every formation unchanged apart from the new badge.
- **Deviations recorded during implementation**
  - **Flash sits under the text:** the overlay is passed into `SquadSlot` through a new `backdrop` prop and painted beneath the badge and name, not layered on top. The `bone` name stays untinted. The filled slot gains `relative overflow-hidden`, so the overlay clips to its corners.
  - **`foundBy` is optional on `SquadSlot`:** when it's absent, the slot is a solo slot, with a `you` badge and no "named by" suffix. That's how `/dev/pitch` keeps working unchanged.
  - **"New" is captured at mount:** `RevealCard` keeps `isNew` from its first render in state. A second reveal inside the ~1s cue re-renders the grid and clears `newIds`, and without this capture it would cut the first card's flash short.
  - **Flash overlay stays mounted** at opacity 0 after its fade, rather than being removed.
  - **Values used:**
    - Spring: `bounce` 0.25, `visualDuration` 0.32s, start scale 0.85.
    - Fade-in: a separate 320ms `easeOut` tween on opacity, so the spring can't overshoot opacity.
    - Flash: peak 0.4, held for 320ms, then fading to 0 over 640ms `easeOut`. The card settles at about 960ms.
    - Opponent flash: the 60 / 40 `turf` / `away` mix, kept as is. It renders a teal (about `oklch(0.77 0.17 193)`).
  - **Reduced motion:** the `scale` transition gets a duration of 0; `initial` isn't branched, following the W11 hydration lesson. Opacity and the flash are unchanged.
  - **Long names on five-wide lines** still clamp to two lines with an ellipsis, as recorded in W09. The badge shares the label row, so the name width is unchanged.

## History
