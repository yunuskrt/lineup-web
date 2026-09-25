# Phase W09 — Pitch & Squad Grid

## Status

Not Started

## Goals

- Install `motion` (import from `motion/react`). This phase is the first to need it: `theme.md` § Motion says slots are positioned with Motion `x` / `y`, never with grid or absolute offsets, so W12's reveal and any re-flow run on `transform` from day one.
- Create `src/lib/formation.ts`, pure and framework-free:
  - `parseFormation(formation)` returns the outfield line sizes (`'4-2-3-1'` → `[4, 2, 3, 1]`), or `null` when they don't add up to 10.
  - `positionForSlot(formation, slot)` returns the `PositionGroup` for a slot. It is moved here from `src/lib/api/mock/types.ts`, which then imports it, so the slot convention exists once in the repo.
  - `slotLayout(formation)` returns 11 `SlotPoint`s (`{ slot, position, x, y }`, with `x` and `y` as percentages of the pitch box), or `null` for an unparseable formation.
- Add `SlotPoint` to `src/types/formation.ts`.
- Create `src/lib/formation.test.ts` covering, for every formation in the fixtures (`4-4-2`, `4-3-3`, `4-2-3-1`, `3-5-2`, `3-4-3`, `4-1-4-1`, `4-1-2-1-2`):
  - exactly 11 points, with unique slots 0–10;
  - every coordinate inside the pitch;
  - the GK lowest and the last line highest, with lines strictly ordered in between;
  - each line mirror-symmetric around `x = 50`;
  - `null` for `'4-4-3'` and `'3-3-3'`.
- Create the components in `src/components/pitch/`:
  - `Pitch.tsx`: an inline SVG with a fixed `viewBox`, `aria-hidden`. It draws the boundary, halfway line, centre circle and spot, both penalty and goal areas, and both penalty spots. Strokes are `stroke-marking` at 1px (`vectorEffect="non-scaling-stroke"`) and there is no fill over the `bg-surface` field. It never takes a raster asset.
  - `SquadSlot.tsx`: a single slot with `state: 'empty' | 'filled'`.
    - `empty`: a `border-marking` outline on the pitch surface, with only the position label (GK/DF/MF/FW) in `text-fg-dim`.
    - `filled`: `bg-surface-card` with a `border-line` edge, the name in `text-fg` Inter Medium (clamped to two lines), and the position label in `text-fg-muted`.
    - Both states are `rounded-sm` and exactly the same size, so filling a slot never shifts anything.
  - `SquadGrid.tsx`: a client component with props `formation: string` and `revealed: RevealedPlayer[]`. It renders `Pitch` with the 11 slots positioned from `slotLayout`. Each slot fills when a revealed player carries its `slot` index.
    - Markup: an `<ol aria-label="Starting XI">` with one `<li>` per slot. Each slot's accessible text is "Defender, not yet named" or "Defender, Rhys Harlow".
    - If `slotLayout` returns `null`, it renders a visible "Couldn't lay out this formation" message inside the pitch, never a partial grid.
- Create a dev route at `src/app/dev/pitch/page.tsx`, outside every route group, like `/dev/theme`. It renders `SquadGrid` for each fixture formation at 0, 4 and 11 revealed players. Its sample `RevealedPlayer`s are written inline in the page, including the longest fixture name, _Christophe Delacroix-Morel_, and accented ones (_Ciarán O'Donovan_, _Íñigo Castañeda_). It never imports from `src/lib/api/mock/`.

## Geometry

- **Orientation.** The GK is at the bottom and the forward line at the top, so the team attacks up the screen.
- **Vertical.** The GK row sits just inside the goal area. The outfield lines are spaced evenly from above the GK to just below the top boundary, so a 3-line and a 5-line formation both fill the pitch.
- **Horizontal.** A line of `n` players is spaced evenly across an inset band, so wide players stay off the touchline. A line of one player sits at `x = 50`.
- **Slot order within a line.** Slots follow published lineup order, from the team's right to its left (RB before LB). Because the team attacks upward, that's the viewer's right to left. `slot` 0 is the GK, and outfield slots fill from defence to attack, the same convention the fixtures and `positionForSlot` already use.
- **Positioning.** Each slot's wrapper is a full-bleed, `pointer-events-none` layer over the pitch. It is moved by Motion `x` / `y` in percent, so percentages resolve against the pitch rather than the chip, and the chip centres on that point with a static Tailwind translate. `initial={false}`, so nothing animates on mount. W09 has no animation at all.
- **Fit.** The pitch keeps its aspect ratio and fits inside whatever box it's given, in both dimensions (a size container query), never overflowing and never scrolling. Chip width and type size scale with the pitch's width in container units, so the widest line (five across in `3-5-2`) fits without overlap at 375px.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Pitch aspect ratio:** stylised at `viewBox="0 0 100 120"` rather than a true 68 × 105. A to-scale pitch is too tall to share a phone viewport with the ring and the input, as the prototype's mobile frame shows. The centre circle stays a circle, so there's no `preserveAspectRatio="none"`.
- **Slot order within a line:** team right to left, as above. The backend owns this convention, so B07 or B39 must confirm it. If they choose otherwise, only `slotLayout` changes.
- **Shared formation helper:** move `positionForSlot` out of the mock into `src/lib/formation.ts` rather than duplicating it. The mock adapter and the UI then agree by construction, and the helper imports nothing from `lib/api/mock`.
- **Names on narrow viewports:** show the full name, clamped to two lines, with the full name in the accessible text. The client never derives a surname (`van der Linde` breaks any rule simple enough to write).

## Out of Scope

- **The reveal:** turf flash, spring, and initials or image avatar → W12. Opponent-tinted fills in a duel → W12 and W23.
- **Already-found pulse** → W14.
- **The loading skeleton** → W15. It reuses `slotLayout` so it matches the loaded grid exactly, which is why the geometry lives in a helper rather than in the component.
- **Match header, the `4/11` count and the formation label** → W16. So is placing the grid in `/play/solo` and `/play/duel`; those placeholders stay as they are.
- **Ring, lives and input** → W10, W11 and W13.

## Notes

- Scope: the static pitch and the 11-slot grid in formation, with empty and filled states, a tested layout helper, and a dev preview route.
- Depends on: W03 (the `marking`, `line` and `surface-card` role utilities), W07 (fixture formations and the slot convention) and W08 (the game frame the grid will sit in at W16).
- **Prototype reference:** `context/screenshots/game-screen-prototype.png`.
  - Taken for this phase: GK at the bottom; markings one shade off the surface; outlined empty slots labelled only by position; two-line names.
  - Not adopted: the initials badge on filled slots (W12 decides the card), and the stretched, elliptical centre circle in the tablet frame.
- Constraints:
  - This is presentation, not game logic. The grid renders what it's given: `formation` from `MaskedMatch`, and `revealed` as pushed. It never infers a player, a count, or whether the XI is complete. It receives only revealed players, never the squad.
  - Slots move through `transform` only (Motion `x` / `y`), never `top`, `left`, grid tracks or `width` / `height`. No CSS transition on any property Motion owns, and no `transition: all`.
  - Colours come from role utilities only (`bg-surface`, `bg-surface-card`, `border-marking`, `border-line`, `stroke-marking`, `text-fg`, `text-fg-muted`, `text-fg-dim`). No hex, and no primitives outside `tokens.css`. The SVG takes its colour from classes, never from `stroke="#…"`.
  - Borders, not shadows. `rounded-sm` slots.
  - No inline styles beyond the Motion `x` / `y` values. Those values are the reason Motion enters here, not a styling escape hatch.
  - `@/` imports only. `Pitch` and `SquadSlot` are server-safe; `SquadGrid` is the only client component, because of Motion. Every component has a typed `Props`.
  - Comments only for the non-obvious, such as the full-bleed wrapper trick.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/pitch`.
  - `src/lib/formation.test.ts` passes, and the existing mock tests still pass after `positionForSlot` moves.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/pitch`:
    - Every formation shows 11 slots with the GK at the bottom, symmetric lines, and no slot overlapping another.
    - Empty and filled slots are the same size.
    - Long and accented names wrap to at most two lines without clipping glyphs.
    - The centre circle is round.
  - At 375px, 834px and 1440px there's no horizontal scroll, and `3-5-2`'s five-man line fits without overlap at 375px.
  - DevTools shows each slot wrapper positioned by `transform`, with no `top` or `left`.
  - A screen reader walks the XI as an ordered list of 11 items with their position and name.
- **Deviations recorded during implementation**
  - **GK row:** sits at `y = 90%`, inside the penalty area and just above the goal area, not inside it. A chip centred in the 6-unit goal area overflows the pitch's bottom edge.
  - **Chip width:** set once per formation from its widest line, through a static class map (`slotWidthClass` in `SquadGrid.tsx`: 24 / 22 / 18%), rather than scaled in container units. A dynamic width would need an inline style. `slotWidthClass` is exported so W15's skeleton reuses it.
  - **Horizontal band:** `x` runs over 3–97%, not a narrower inset, so a four-wide line fits 22% chips.
  - **Chip height and type:** fixed at `h-14` with `text-12`, stepping to `h-16` with `text-14` once the pitch is at least 560px wide (a container query). This keeps chip type on the 12 / 14 scale instead of scaling it continuously.
  - **Empty slots:** filled `bg-surface`, so pitch markings don't run through them.
  - **Pitch box:** clips overflow. The full-bleed slot layers translate past its edge and caused horizontal page scroll.
  - **Long names:** the widest lines break a single long word mid-word when the browser has no hyphenation dictionary. The two-line clamp then ellipsizes it, e.g. "Christop / he…" in a five-wide line.
  - **No `title` tooltip on filled slots:** it gave the chip a second accessible name beside the sr-only text.
  - **`parseFormation`:** also rejects zero-size lines (`4-6-0`). The mock's side schema now uses it for its outfield check, which makes that check slightly stricter.
  - **Tests:** the `positionForSlot` tests moved from `src/lib/api/mock/types.test.ts` to `src/lib/formation.test.ts`.

## History
