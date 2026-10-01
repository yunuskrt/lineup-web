# Fix — Control Rail Layout

## Status

Completed

## Goals

- Rebuild the gameplay control rail (`ActiveRail` in `src/components/game/GameCanvas.tsx`) as three stacked blocks at `lg` and up, top to bottom:
  - **Clock block**, centred horizontally: a label above the ring, the ring with its numeral and a "seconds" caption, then a stage chip.
  - **Lives card**, directly under the clock block.
  - **Guess block**, pinned near the bottom (`mt-auto`, as today): `GuessInput`, with the toast floating above it as today.
- Clock block:
  - One `CountdownRing` in both modes. The ring grows to 192px (`size-48`) at `lg`, and stays 144px below it. The numeral stays 64px; `theme.md` gives 64 to the countdown only.
  - A muted 12px "seconds" caption sits under the numeral, inside the ring.
  - The stage chip names the current stage from `countdownStage`: "Calm (15–8s)", "Warning (7–4s)" and "Critical (3–0s)". It shows while the ring is running or frozen, and is hidden while the ring is waiting. `CountdownRing` owns the seconds, so it renders the caption and the chip itself.
  - The label above the ring is "Round clock" in solo, and in a duel before the first round. During a duel round it reads "Your turn" in `you`, or "Their turn" in `opponent`. That label is now the always-visible turn cue.
- Duel: one ring, not two.
  - On your turn it's your clock, escalating `fg` → `warning` → `danger` as in solo.
  - On their turn it's their clock, in `opponent`.
  - Before the first round it waits in `fg-dim`.
  - A pure helper in `src/lib/canvas.ts` picks the one ring setup and its owner from `clock` and `turn`, and replaces the two-ring use of `ringSetups`.
- Lives card, in solo:
  - A `surface-card` panel with a 1px `line` border and the `md` radius, holding the label, the pips and the rule hint.
  - Each pip sits in its own tile: a `line` border, which turns `you` while that pip is filled.
  - Label: "Lives". Rule hint in 12px `fg-muted`: "Clock at 0 costs a life. The run ends at 0 lives."
- Lives card, in a duel:
  - It shows one player at a time: a "You" / "Opponent" label in the player's colour, the handle, then that player's pips in their colour.
  - It follows the turn. On every handover it switches to the player whose turn it is, and a peek at the other player resets on the next handover.
  - If the outgoing player just lost a life, the card holds on them for `MOTION_SECONDS.lifeLost` so the pip visibly empties, then switches. This is presentation only; the server still decides the life.
  - Two dots under the pips toggle between the players. Each dot is a button with `aria-pressed` and an `aria-label` ("Show your lives" / "Show opponent's lives"). The dots are filled in the player's colour, and empty (`fg-dim`) when not shown.
  - Each dot has a hit area of at least 24px (WCAG 2.5.8) and the shared `FOCUS_RING`. A mouse click must not take focus from the guess field (`preventDefault` on `mousedown`); keyboard users reach the dots with Tab.
  - Until pairing, the opponent dot is disabled, and there's no opponent to show.
  - Rule hint: "Clock at 0 costs a life. 0 lives loses the duel."
  - The card occupies the same space for either player; long handles truncate.
  - Switching is an opacity crossfade at `turnHandover` timing. It gets a new `MotionEffect` (`livesSwitch`, `keep`, since it's opacity only) in `src/styles/motion.ts`, classified in `motion.test.ts`.
- Opponent reconnecting:
  - The reconnect chip ("Reconnecting, 18s", `warning`) moves into the Lives card header. It shows whichever player the card is showing, so it's never hidden behind the toggle.
  - The opponent's dot turns `warning` while they're reconnecting.
  - The waiting line in place of the input is unchanged.
- Remove `TurnIndicator` from `GameCanvas`. The turn cue is now the clock label plus the ring colour, and the lives are now in the card.
  - The polite `turnAnnouncement` live region moves into the rail.
  - `/dev/lives` switches to previewing the new Lives card.
- Below `lg`, the rail becomes a compact band under the pitch, as in `context/screenshots/game-screen-prototype.png` (tablet and mobile):
  - The ring (144px) and the stage chip sit left, and the Lives card sits right.
  - The input goes underneath, across the full width.
  - The rule hint is hidden below `lg` to keep the band short.
  - The quit chip and toast placement are unchanged.
- Update `context/theme.md`, which owns the states, in the same fix:
  - § Duel — their turn, "Waiting": "The rail's single ring switches to their clock, in `away`, and the Lives card switches to them. Grid read-only, input hidden."
  - § Duel — their turn, "Opponent disconnected": the `ember` "Reconnecting, 18s" chip sits in the rail's Lives card header.
  - § Signature components, "Turn indicator": "The amber/blue pair, always visible, never subtle: the rail's clock label and ring colour name whose turn it is, and the Lives card shows the active player, with a dot toggle for the other."
  - § Signature components, "Countdown ring": add the "seconds" caption and the stage chip.
- Tests:
  - The pure helpers in `src/lib/canvas.ts` (the one-ring pick, and the clock label) and the stage label in `src/lib/countdown.ts`, each with a unit test.
  - The dot button class goes into `src/styles/classes.ts` and the focus-ring guard in `classes.test.ts`.
  - The new motion effect is covered by the classification test.

## Layout

At `lg` and up, the rail stays `lg:w-88` beside the pitch:

```text
┌──────────────────────────────┐
│         ROUND CLOCK          │  duel: YOUR TURN / THEIR TURN
│         ╭────────╮           │
│         │   9    │  192px    │
│         │seconds │           │
│         ╰────────╯           │
│      [Calm (15–8s)]          │
│                              │
│ ┌──────────────────────────┐ │
│ │ LIVES   [Reconnecting,18s]│ │  chip only while reconnecting
│ │ You · handle (duel)       │ │
│ │  [👕]  [👕]  [  ]         │ │
│ │ Clock at 0 costs a life…  │ │
│ │          ● ○  (duel)      │ │
│ └──────────────────────────┘ │
│                              │
│            (space)           │
│ GUESS A PLAYER  Press Enter ↵│
│ [ Name a player…           ] │
└──────────────────────────────┘
```

Below `lg`, the rail is a compact band under the pitch:

```text
┌──────────────────────────────────────┐
│ ╭─────╮            ┌───────────────┐ │
│ │  9  │            │ LIVES         │ │
│ ╰─────╯            │ [👕][👕][  ]  │ │
│ [Calm (15–8s)]     │      ● ○      │ │
│                    └───────────────┘ │
│ [ Name a player…                   ] │
└──────────────────────────────────────┘
```

## Out of Scope

- `RunSummary` and `DuelResultPanel`. They already show lives, and they replace the whole rail at the end.
- Gates, the lobby panels, the quit dialog, and `GuessInput` behaviour. Only its place in the rail changes.
- The screenshot's "2 of 3" count and its "Quick try" hint. The count wasn't picked, and the hint is prototype copy.
- Any change to what the server sends, or to the turn and lives logic. The rail only renders the view.

## Open Questions

Defaults stand unless changed at load:

- **`TurnIndicator.tsx` once unused.** Default: ask at `/feature start` before deleting the file and its test. `ReconnectChip` moves into the Lives card first.
- **Stage chip on their turn.** Default: it names their stage, in `fg-muted`, since their ring doesn't escalate in colour.

## Notes

- Source: a user request on 2026-10-01 to fill the empty gameplay rail. The design reference is `context/screenshots/control-rail-gameplay-desktop.png`; `theme.md` and `design.md` win any conflict with it.
- Decisions taken when this doc was written:
  - Duel lives: one player at a time with a dot toggle, following the turn by default, rather than two rows.
  - One ring in duel: `theme.md` is updated in the same fix, rather than recording a deviation.
  - Screenshot extras kept: the stage chip, the "seconds" caption and the rule hint.
  - Below `lg`: a compact band, not the full stack.
- Constraints:
  - Tokens only. **Never hardcode a colour**; borders and background lifts, not shadows; tight corners.
  - The ring still sweeps linearly and never reads the reduced-motion preference.
  - Motion for any animation, opacity and transform only; new effects go through `REDUCED_MOTION_POLICY`.
  - No game logic. The stage, the ring owner and the card's player are derived from the server's view.
  - One primary action per view: the input stays the rail's only primary control, and the dots are quiet toggles.
  - `@/` imports, single-line comments of at most 50 characters.
- Verification:
  - `npm test`.
  - In the browser at 1440, 834 and 390, check these `?state=` snapshots:
    - Solo: `idle`, `warning`, `critical`, `pending`, `life-lost`.
    - Duel: `idle`, `their-turn`, `their-reveal`, `their-life-lost`, `opponent-reconnecting`, `life-lost`, the lobby steps and the result states.
  - A live mock duel through a few handovers: the card follows the turn, a dot peek resets on handover, and clicking a dot on your turn leaves focus in the input.
  - Reduced motion emulated: the ring still sweeps, and the card switch still fades.
  - A keyboard walk: quit, the dots, then the input, with a visible ring on each.
  - `npm run build`.

**Deviations recorded during implementation**

- Solo "Round clock" label hidden below `lg`; the duel turn label stays, since it's the turn cue.
- Empty toggle dots outlined in `fg-muted`, not `fg-dim`: `fg-dim` on `surface-card` is 2.93:1, under 3:1 for a control.
- Empty pips stay `fg-dim` on the card, with a new `CONTRAST_EXCEPTIONS` entry; the count is in the filled pips and the label.
- The card holds on any player whose lives drop, not only at handover: the session sends lives and turn together.
- The card's shown-player rule moved to pure helpers in `duel-status.ts` (`droppedLifeActor`, `shownLivesActor`) so it's unit tested.
- New `LIFE_LOST_BORDER_SHIFT` so a tile's border fades with its pip, not snapping.
- Stage chip dropped on review (user request): the ring's colour escalation already names the stage. `STAGE_LABELS` and its tests went with it.
- `TurnIndicator.tsx` deleted at start (asked, as the spec said), with the code only it used: `TURN_BORDER_SHIFT`, and the `turnChipSlide` and `turnBorderShift` effects. `ReconnectChip` moved to its own file first.
- Duel player row is the label and handle side by side, with no middle dot (frontend-design's templated-tells check).
- Rail labels use the existing 12px uppercase style of the guess label, so the rail reads as one set.
- `/dev/lives` gained "Clock runs out", "Opponent reconnecting" and "Before pairing" controls to reach the card's states.

## History
