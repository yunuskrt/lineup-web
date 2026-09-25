# Phase W11 — Lives & Turn Indicator

## Status

Not Started

## Goals

- Add `MAX_LIVES = 3` to `src/lib/api/schemas/game.ts`, next to `livesSchema`, and have `livesSchema` use it for `.max()`. It's a contract constant like `SQUAD_SIZE`, so the pip count isn't a bare 3 in a component. The mock's `STARTING_LIVES` stays where it is.
- Create `src/components/game/Lives.tsx`, a client component:
  - Props: `lives: Lives` and `owner: DuelActor`, with the owner defaulting to `'you'`.
  - Draws `MAX_LIVES` pips in a row. Filled pips are the owner's colour (`fill-you` or `fill-opponent`); empty pips are `fg-dim`.
  - The pip is a small inline-SVG shirt, as in the prototype and allowed by `theme.md` § Signature components. It's not a heart, and there's no raster or icon library.
  - When `lives` drops, the pip that empties plays the life-lost cue:
    - a horizontal shake of 480ms (`MOTION_DURATION_MS.lifeLost`) via Motion `x`;
    - a fill change from the owner colour to `fg-dim`, as a CSS transition on the named `fill` property.
  - The drop is detected by comparing the incoming `lives` with the previous value, using React's "store the previous prop in state" pattern, not an effect.
  - A rise in `lives` (a new game) or the first mount snaps with no animation.
  - Accessible as `role="img"` with the label "`n` of 3 lives left". The pips are `aria-hidden`.
- Create `src/components/game/LifeLostFlash.tsx`, a client component:
  - A full-viewport `danger` overlay that is `pointer-events-none`, `fixed inset-0` and `aria-hidden`.
  - Its opacity goes from 0 to a peak and back to 0 over 480ms, animated by Motion.
  - Props: `flashKey: number`. Each new value replays the flash once. Its initial value never flashes.
  - The component only draws. Deciding when to flash (your life, not theirs) is up to its caller.
- Create `src/components/game/TurnIndicator.tsx`, the amber/blue pair for duels:
  - Props: `you: DuelPlayer`, `opponent: DuelPlayer` and `turn: DuelActor`, taken from the contract types as-is.
  - Two side-by-side panels with fixed positions, you on the left and the opponent on the right. They never swap places.
  - Each panel shows the handle, a "You" / "Opponent" label and a `<Lives>` for that player, so identity is never colour alone.
  - The active panel carries its player colour on the border and a solid "Your turn" / "Their turn" chip, with `bg-you` or `bg-opponent` and `text-on-accent` text. It's never subtle.
  - The inactive panel sits on `border-line` with `text-fg-muted` and no chip.
  - Handover:
    - The chip enters with opacity and `x` over 240ms (`MOTION_DURATION_MS.turnHandover`, `MOTION_EASING.turnHandover`).
    - The border colour changes with a CSS transition on the named `border-color` property.
    - Under reduced motion the chip appears without the slide.
  - The indicator holds a single `aria-live="polite"` text: "Your turn" or "Their turn". It fires on handover only, never on lives.
- Create a dev route at `src/app/dev/lives/page.tsx`: a server page with the `notFound()` guard, like `/dev/ring`. It renders the client component `src/components/dev/LivesPreview.tsx`, which shows:
  - static `Lives` specimens at 3, 2, 1 and 0 for both owners;
  - a live `Lives` with "Lose a life" and "Reset" buttons, which plays the shake and the `LifeLostFlash`;
  - a live `TurnIndicator` with "Hand over", "You lose a life" and "They lose a life" buttons. Only your loss flashes the screen.
  - The preview builds its players locally and never imports from `src/lib/api/mock/`.

## States

| State                   | Trigger (supplied by W16, W20 and W23) | Pips                                    | Screen flash | Turn indicator                         |
| ----------------------- | -------------------------------------- | --------------------------------------- | ------------ | -------------------------------------- |
| Solo, at rest           | Round live                             | `n` filled in `you`, rest `fg-dim`      | —            | Not rendered                           |
| Solo, life lost         | Server reports fewer lives             | Emptying pip shakes, fill → `fg-dim`    | Yes, 480ms   | —                                      |
| Duel, your turn         | `turn: 'you'`                          | Both rows at rest                       | —            | Left panel `you` border and chip       |
| Duel, their turn        | `turn: 'opponent'`                     | Both rows at rest                       | —            | Right panel `opponent` border and chip |
| Duel, you lose a life   | `lifeLost` with `who: 'you'`           | Your emptying pip shakes                | Yes          | Unchanged until `turnChanged`          |
| Duel, they lose a life  | `lifeLost` with `who: 'opponent'`      | Their emptying pip shakes               | **No**       | Unchanged until `turnChanged`          |
| Out of lives            | `lives: 0`                             | All `fg-dim`                            | —            | Unchanged; the result screen follows   |

- **Server-pushed only.** Every row above is triggered by a value the server sent. No component counts down lives, infers a loss from the ring reaching 0, or decides whose turn it is.

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Pip shape:** default is a shirt, matching the prototype and giving the most football feel at 16–20px. A plain circle is the fallback if the shirt reads poorly at the compact mobile size.
- **Opponent pip shake:** default is yes. The shake shows _which_ row changed, and only the screen flash is kept for your loss (`theme.md` § Duel — their turn: "No screen flash; it isn't your loss").
- **Flash under reduced motion:** default is to keep it, capped at a low peak opacity (about 0.25) with no repeat. It carries information (you lost a life), and a single fade isn't movement. The shake is dropped.
- **Flash peak opacity:** default 0.25 at full motion as well, so cream text stays readable through it. Record the value used.
- **Opponent reconnecting badge** (`away` → `ember`, "Reconnecting, 18s"): default is out of scope here and built in W23, where the connection state is wired. The indicator gets no `connection` prop in W11.

## Out of Scope

- **Placing** the lives in the solo rail, the indicator above the duel canvas and the flash at the screen root → W16 (canvas shell), W20 (solo) and W23 (duel).
- **Subscribing** to `lifeLost` or `turnChanged`, and any store → W20 and W23. The components take props only.
- **The opponent reconnecting and forfeit treatments** → W23 and W25.
- **Screen-reader announcements for a lost life** → W26.
- **Changes to the countdown ring.** The ring resets on a new round from the server; it never triggers the flash.

## Notes

- Scope: presentation-only lives and turn-identity components, plus a dev preview route. Nothing is wired to the API client.
- Depends on:
  - W02a: `MOTION_DURATION_MS.lifeLost` and `.turnHandover`, and `MOTION_EASING.turnHandover`.
  - W03: the `you`, `opponent`, `fg-dim`, `danger`, `line` and `on-accent` role utilities.
  - W05: `Lives`, `DuelActor` and `DuelPlayer`.
  - W10: the ring's pattern for an inline colour-transition style and for a dev route with a client preview.
- References:
  - `context/theme.md` § Palette rules (amber vs blue, never colour alone), § Motion (life lost is 480ms, handover 240ms) and § States (duel: your turn, their turn, their life lost).
  - `context/screenshots/game-screen-prototype.png` (shirt pips, "2 of 3").
- Constraints:
  - **No game logic.** Lives and turn are props from server state. The components never decrement, never start a round and expose no callbacks. The screen flash only renders; it doesn't gate input.
  - **Exactly 3 lives**, from `MAX_LIVES`. Not a prop, and not configurable.
  - **Amber/blue identity is paired with position and label.** "You" is always left and labelled; the opponent is always right and labelled. Never green/red.
  - **Motion and CSS never share a property.**
    - Motion owns `x` and `opacity` (the shake, the chip and the flash).
    - CSS transitions `fill` and `border-color` by name. No `transition: all`.
  - **Reduced motion is a scalpel.** Only the shake and the chip slide check `useReducedMotion()`. The state change itself is always shown.
  - **Transform and opacity only** for anything Motion animates.
  - **Colours come from role utilities only** (`fill-you`, `fill-opponent`, `fill-fg-dim`, `bg-danger`, `border-you`, `border-opponent`, `bg-you`, `bg-opponent`, `text-on-accent`). No hex, and no `fill="#…"`.
  - Text on `you` (floodlight) uses `text-on-accent`, never `fg`. Text on `opponent` (away) uses it too, for consistency.
  - `@/` imports only, and typed props. Comments only for the non-obvious. Follow the existing `export function` component pattern in `src/components/game/`.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The build output lists `/dev/lives`.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser at `/dev/lives`:
    - The specimens show 3, 2, 1 and 0 filled pips in the right colour for each owner. Empty pips are `fg-dim`.
    - "Lose a life" shakes exactly the emptying pip for about 480ms, fades its fill to `fg-dim` and flashes the screen `danger` once. "Reset" refills with no animation.
    - The indicator: "Hand over" moves the chip and coloured border between panels, and the panels don't swap places. "They lose a life" shakes their pip with no screen flash.
    - With `prefers-reduced-motion: reduce` emulated before load, there's no shake and no chip slide. The pip still empties, and the flash still shows at its low peak.
    - The accessibility tree shows "2 of 3 lives left", and a polite live region reads "Their turn" after a handover.
    - No horizontal scroll at 375px, and the console shows no hydration warnings.
- **Deviations recorded during implementation**
  - **Pip:** a 24-unit shirt path drawn at `size-5` (20px), with a gap of 4px.
  - **Shake values:** `x` keyframes 0, −4, 4, −3, 3, 0 (px) over 480ms. `theme.md` gives only "shake". A drop of more than one life shakes every pip that empties.
  - **Fill fade:** 480ms (`MOTION_DURATION_MS.lifeLost`) with the CSS default `ease`, because there's no easing token for a life lost. It's applied only to the pips that are emptying, so a refill snaps.
  - **Flash values:** the peak opacity is 0.25, reached at 25% of the 480ms, with `easeOut`. It's the same with and without reduced motion.
  - **Chip slide:** 8px, entering from the side the turn came from. Under reduced motion, the `x` transition gets a duration of 0 instead of a branched `initial`. Branching `initial` on `useReducedMotion()` caused a hydration mismatch. The chip still fades in.
  - **Border width:** panels use a 2px border (`border-2`), not the 1px default in `theme.md` § Form. At 1px the active colour read as too subtle for "never subtle".
  - **Handover easing:** the border transition uses CSS `ease-out`, the CSS equivalent of Motion's `easeOut` token.
  - **Narrow panels:** each panel is a container. Below 14rem, the chip gets its own row under the label, and that row is always reserved. Without this, the chip spilled out of a panel at 375px, and handles would shift on handover.
  - **Mirrored opponent panel:** the opponent panel is right-aligned, with its label on the outer edge, so the pair reads as two sides facing each other.

## History
