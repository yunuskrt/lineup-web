# Redesign B1 — Canvas, Header and Pitch

## Status

Completed

## Goals

The first part of redesign stage B (the game screen, `context/docs/ui-redesign-references.md` § 4): the canvas layout, the scoreboard, the pitch and the slots on `/play/solo` and `/play/duel`. Builds on stage A's theme, `ui/` kit and type roles. **Behaviour, copy and accessible names don't change.**

- **Canvas layout.** Three outlined cards on the cream page, as in `game/00-desktop-a` (layout only):
  - the **match header** card across the full width on top, from `lg` spanning the pitch and the rail;
  - the **pitch card** below it on the left;
  - the **rail card** on its right from `lg` (`lg:w-88`, as today). Its contents are B2.
  - Each card: 2px ink outline, `rounded-lg`, the A2 hard shadow, a white (`surface-card`) fill. They replace today's `PANEL` (`border` + `surface-raised`).
  - **Phones** (`game/00-mobile-a`): header, then pitch, then the rail band, stacked. The Quit and sound chips stay in the header row (top right), first in tab order, as today.
  - The perfect-clear outline (`border-found`) stays on the pitch card.
- **`MatchHeader`**, as in `game/01-scoreboard-a`/`-b` (layout only):
  - three columns: the home crest with its name beneath, the score in the centre, the away crest with its name beneath;
  - the score in `TYPE_NUMBER` (Archivo 900, width 125, slashed zero), with the competition logo and name plus the date on a quiet line under it;
  - the side being named keeps its emphasis: name in `fg` with the crest's ink ring (today's `ClubCrest isNamed`); the other side muted;
  - short club names below `sm`, full names from `sm`, as today;
  - the found count ("4/11") moves out of the header (open question 1);
  - a fixed height, and the loading skeleton takes the same boxes, so nothing shifts when the match arrives.
- **`Pitch`**, as in `game/02-pitch-b` (flat, outlined) with the formation spacing of `02-pitch-c`:
  - **flat mint turf** (`block-mint`, `#A7E3C4`) with **ink** lines; no stripes, checks or gradients (decided 2026-11-15);
  - adds the drawn details the references have and ours lacks: the penalty arcs and the corner arcs;
  - **upright on every width**, goalkeeper at the bottom (decided 2026-11-15). The 100×120 viewBox and the formation layout stay.
  - The `marking` role becomes ink for the lines. Check that nothing else uses it.
- **`SquadSlot`**, as in `game/03-slot-a`–`d`. The rectangular boxes go; each slot becomes a disc with a label under it. The container-query sizes stay, so the densest formation still fits.
  - **Empty** (`03-slot-d`): an outlined disc (2px ink, white fill) with the person glyph, over an outlined pill holding the position (GK, DF, MF, FW).
  - **Filled**, which is also the reveal card (guide § 4 `RevealCard`):
    - the A2 `Avatar` (photo, or initials when there's none) in a 2px ink outline;
    - the name on a label under it: 2px ink outline, A2 hard shadow (small), Inter 600;
    - the label's fill is the finder's colour in a duel (`you` blue, `opponent` orange; ink text, ≥ 5:1), and white in solo (open question 2).
  - **Missed** (Pro reveal after a run): the same shape, dimmed: dashed outline, `fg-muted` name, the photo at 60%.
  - **Loading**: the disc and the pill as skeleton shapes, at the slot's real size.
  - The finder's colour is never the only cue: the screen-reader line ("named by your opponent") stays.
- **`RevealCard`** keeps today's moment (scale-in spring, then a flash in the finder's colour) and the already-found pulse, redrawn around the new disc and label. Reduced motion is unchanged.
- **`PlayerHeadshot`** renders through `ui/avatar` (photo, initials fallback, broken-image fallback), keeping its sizes and its `foundBy` ring for the suggestion rows.

## Out of Scope

- The rail: clock, lives, turn sticker, guess box, practice card (B2).
- The gate, the side pick, the run summary and the named-order list (B3).
- The duel lobby, result panel and reconnect pieces (stage E).
- New motion: the label's tilt-and-settle and every other added animation wait for the motion pass.

## Open Questions

1. **Where the found count goes.** The new three-column header has no right column, and on phones the chips sit in the header's top-right corner. **Default:** a sticker `Badge` ("4/11") on the pitch card's top-left corner, keeping its screen-reader line. The alternative is a small line under the score.
2. **Label fill in solo.** **Default: white**, so the reveal's green flash is the solo "correct" cue and the pitch stays calm. The alternative is a `found` green label on every solo slot.

## Notes

- **References:**
  - `context/screenshots/game/00-*`, `01-*`, `02-*` and `03-*`;
  - the per-image notes in `context/screenshots/notes.md`;
  - the decisions in guide § 4.
- **No shirt numbers.** The player data has none, so slots show the position until found, unlike `00-mobile-a`.
- **Contrast:** add the new pairs to `src/styles/contrast.ts` tests: ink lines on mint (≥ 3:1), ink text on `you`/`opponent` labels (≥ 4.5:1).
- **Check:**
  - `?state=` snapshots on `/play/solo` and `/play/duel`;
  - `/dev/pitch`, `/dev/reveal`, `/dev/loading`;
  - 320px, 360px, `sm`, `lg`;
  - 4-4-2, 4-3-3 and 3-5-2 formations;
  - no horizontal overflow, no layout shift when the match loads.
- Then B2.
- **Deviations recorded during implementation:**
  - **One board, not three cards (user review, 2026-11-15).** The cards looked split and left white around the pitch.
    - The game is one outlined board with one hard shadow: the scoreboard strip on top, the pitch pane, and the rail pane (`surface-raised`). Ink rules divide them.
    - The pitch pane is turf edge to edge, with no white. The "Match" region wraps the scoreboard strip only.
  - **The scoreboard is a dark stadium strip** (user asked for a creative, game-like scoreboard):
    - ink background (`scoreboard`), cream names (`on-scoreboard`), butter score digits (`score-digits`);
    - crests on white tiles, the named side marked with a butter outline;
    - stacked on phones, one row from `sm`.
    - The quit and sound chips moved onto the strip at every width. The chip row above the board is gone, which gives the pitch its height back.
  - **Pitch:**
    - **mown checks** inside the lines, as in `02-pitch-b` (user request): `turf` plus `turf-check`, drawn in the SVG's own units so they scale with the pitch;
    - below `lg` the pitch sizes from its width (`aspect-[5/6]`, capped at 70svh), so the whole pitch shows on phones.
  - **Bigger photos (user review: photos too small beside the names):**
    - the disc size comes from the formation's line count through a `--disc` variable: 3 lines `clamp(28px,12cqw,72px)`, 4 lines `clamp(20px,8cqw,56px)`, 5 lines `clamp(18px,6.5cqw,40px)`;
    - each slot's spot is now the disc's foot (the label hangs below), so a reveal never shifts the disc;
    - labels are 11px below a 360px pitch.
    - Slot positions are unchanged.
  - **Buttons (user review):** "Change filters" / "Back to play" in the summary, and every gate's secondary action, are secondary Buttons, no longer text links. See Pro stays a link.
  - **Gate scrim** is rounded to the board's corners.
  - **The home page demo** (`ShowcaseFrame`) reuses these pieces, so it now shows the dark scoreboard strip, the checked pitch and the count sticker. Intended; stage D starts from it.
  - **`marking` isn't remapped:** home `RuleMarks` also uses it. The pitch draws in `line` (ink).
  - **Open questions took their defaults:**
    - **Count:** a shared `FoundCount` sticker on the pitch's corner, also on the landing demo.
    - **Solo labels:** white.
  - **`PlayerHeadshot`:**
    - `foundBy` fills the disc (the Avatar tone);
    - initials wait 300ms for a photo, and scale with the disc;
    - Base UI's image replaces `next/image`.
  - **Missed labels** use the base turf fill: `fg-muted` stays at 5:1 over the darker checks.
  - **Contrast:**
    - added pairs: ink on `turf`, `fg-muted` on `turf`, `on-scoreboard` and `score-digits` on `scoreboard`;
    - dropped exception: `fg-dim` on `surface`.
  - **Bug fix, outside the spec (user report):** after a solo quit the clock kept ticking. `soloCanvasView` now freezes the clock once a quit is sent and drops the round once the run is over, the way the duel already does. Presentation only; two tests added.
