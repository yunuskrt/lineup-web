# Redesign B2 — Rail: Clock, Lives and Guess Box

## Status

Completed

## Goals

The second part of redesign stage B: everything in the rail while a game is live. Depends on B1. **Behaviour, copy, timing and accessible names don't change**: the clock still renders from the server timestamp, and nothing here decides anything.

**Adapted to B1 as built (2026-11-15).** B1 replaced the planned cards with one board, and the rail became the board's peach pane (`surface-raised`). The user's rule from that review applies here too: **united, not carded, no white panels.** The rail's pieces sit on the pane as sections, not as white cards. Form controls (the guess input) stay white, since they're fields.

- **Rail order.** From `lg`: the turn sticker and the clock, then lives, then the guess box at the bottom (as today). On phones: the clock and lives side by side in a compact band, the guess box below. The 320px band rules from Pro Polish C stay: bare shirts under 360px, and the reconnect chip wraps under 414px.
- **Rail sections.** Clock, lives and the guess box are sections of the pane, divided by 2px ink rules that run edge to edge, like the board's own dividers (open question 3).
- **Turn indicator.** The duel clock label ("Your turn" / "Their turn") becomes the A2 sticker `Badge` in the actor's tone (`you` / `opponent`), above the clock. Solo keeps its quiet label, hidden below `lg` as today. The live-region announcement is unchanged.
- **`CountdownRing`**, as in `game/05-timer-a`:
  - an **open arc** (about 270°, the gap at the bottom) with round caps, on a `rule` track of the same arc;
  - the coloured arc has an **ink edge**: a slightly wider ink stroke under the coloured one, so the pastel arcs read on peach. Neubrutal, and it clears 3:1 for the graphic;
  - the sweep stays **linear**, the fraction of time left mapped onto the arc's length. Never eased.
  - the number in `TYPE_NUMBER` (Archivo 900, width 125, slashed zero), "seconds" under it;
  - **three stages, by weight as well as colour** (decided 2026-11-15), so amber never reads as the opponent's orange:

    | Stage | Arc colour | Arc weight | Number |
    | --- | --- | --- | --- |
    | Normal | the owner's colour (open question 2) | base | ink |
    | Warning (7–4s) | amber (`warning`) | thicker | `warning-text` |
    | Critical (3–0s) | red (`danger`) | thickest, pulsing each second | `danger-text` |

  - **The opponent's turn:** orange arc at base weight, number in `opponent-text`, no warning or critical stage, as today (urgency belongs to your own clock, theme.md § Sound).
  - **Waiting:** `fg-dim`, as today.
  - Reduced motion drops only the pulse; the colour and weight changes stay, and the clock keeps running.
  - The radius shrinks with the thickest weight so the arc never clips. The stage change may transition its colour and weight. The sweep never does.
- **`Lives` and `LivesCard`** (guide § 4, designed without a reference): a lives section shaped like a streak card's content, on the pane with **no white card around it** (B1 rule).
  - a "Lives" label, then a **big number** (lives left, `TYPE_NUMBER`) beside a row of our three shirts;
  - a remaining life is a shirt filled in the owner's colour with an ink outline. A lost one is an empty **dashed** outline (`fg-dim`). The bordered tiles around each shirt go.
  - the lg-only hint line stays.
  - **Duel:** the section shows whoever's turn it is, as today. Their name sits in a sticker `Badge` in their tone beside the label, and their shirts are in their colour. The peek dots, the hold-on-drop timing and the reconnect chip keep their behaviour; the dots take the new outline.
  - The life-lost shake and fill fade keep their current motion and reduced-motion rules.
- **`GuessInput` and `SuggestionList`**, in the neobrutalism.dev [Combobox](https://www.neobrutalism.dev/docs/combobox) / [Command](https://www.neobrutalism.dev/docs/command) look (accepted 2026-11-15):
  - **The input:** the A2 input (2px ink, white, `rounded-md`). Its states keep their current behaviour and get the new look:
    - **live**;
    - **pending:** the spinner inside, in the neobrutalism.dev [Spinner](https://www.neobrutalism.dev/docs/spinner) look, ink on a `rule` track;
    - **locked:** dimmed;
    - **cooldown:** the rate-limit countdown line stays;
    - **not in XI:** shake plus the red outline.
  - **The popup:** above the input, as today. 2px ink outline, hard shadow, `rounded-md`. Up to 5 rows, then it scrolls. Each row has the A2 `Avatar` (size-8) and the name. The highlighted row takes a `brand` (lavender) fill. Already-named rows are dimmed and inert, with their "Named" marker.
  - Keyboard, focus and ARIA behaviour unchanged: focus stays in the input, arrows move the highlight, Enter submits free text, picking a row submits it (open question 1).
- **`FeedbackToast`** keeps its A2 look and its place (floating over the band on phones).
- **`PracticeCard`**, the accepted `Card` look adapted to the pane (no white fill): "Practice" in `TYPE_CARD_TITLE` with a mint (`block-mint`) icon tile or sticker so it reads as information, and the existing line in `fg-muted`. It takes the clock and lives section's place. Copy unchanged.
- **Their turn:** the waiting line ("Waiting for {handle}…") stays text, in the input's cell, with no shift on handover.

## Out of Scope

- The reconnect chip and the reconnecting overlay (stage E restyles them; B2 only keeps them placed).
- The gate, the side pick and the summary (B3).
- New motion beyond what exists.
- Sound: no cue changes.

## Open Questions

1. **The combobox engine.** neobrutalism.dev's Combobox is built on Base UI's Combobox. Ours is hand-built and tested: focus never leaves the input, Enter submits free text that matches no row, named rows are inert, and the shake, pending and cooldown states all hook in. **Default: keep our component and adopt only the look.** The alternative, swapping to Base UI's Combobox, risks those behaviours for no visible gain.
2. **The normal-stage colour in solo.** **Default: blue (`you`)** in solo and in a duel, as guide § 4 says ("the owner's colour"). The alternative is ink in solo, where there's no opponent to tell apart.
3. **How the rail's sections separate.** **Default: edge-to-edge 2px ink rules**, matching the board's dividers. The alternative is an outlined panel with no fill (ink border on the peach) around lives only. That's closer to the guide's "streak card", but it reads as a card again.

## Notes

- **References:** `context/screenshots/game/05-timer-a`; guide § 4 (`CountdownRing`, `Lives`, `GuessInput`, `PracticeCard`); theme.md § Rules and § States (duel your turn, their turn, solo).
- **Rules to keep:** the clock is drawn from the server timestamp, linear, with three stages; whose turn it is shows by label as well as colour; reduced motion never stops the clock.
- **Contrast:** the rail is peach (`surface-raised`), not white.
  - The pastel arcs alone are under 3:1 on it, which is why the arc gets an ink edge.
  - The numbers use their `-text` shades, already tested on `surface-raised`.
  - Add any new pair to the `src/styles/contrast.ts` tests.
- **B1 context:**
  - the quit and sound chips moved onto the scoreboard strip;
  - the board, the rail pane and its `lg:w-88` width are B1's;
  - `.next/dev` stale-CSS issue: if the UI looks unstyled after a dev restart, see the Turbopack note before suspecting code.
- **Check:**
  - `/dev/ring`: all three stages, the opponent's turn, waiting, reduced motion;
  - `/dev/lives`: solo, duel, a drop, a peek, reconnecting;
  - `/dev/guess` and `/dev/feedback`: every input state, the popup with named rows, the keyboard;
  - `?state=` snapshots;
  - 320px, 360px, 414px, `lg`.
- Then B3.
- **Deviations recorded during implementation:**
  - **Open questions took their defaults:**
    - our own combobox, with the neobrutalism.dev look only;
    - blue (`you`) as the normal stage in solo;
    - edge-to-edge 2px ink rules between the rail's sections. On phones a vertical rule sits between clock and lives, dropped when the reconnect chip wraps lives under the clock (below 414px).
  - **Clock number:** `text-48` below `lg`, `text-64` from `lg`. Archivo at width 125 is wider than the old numerals, and 64px collided with the arc in the 144px ring. Measured: 78px in a 101px opening, 104px in 134px.
  - **Clock tones:**
    - the numeral is ink in the normal stage, for you and in solo;
    - the arc weights are 6 / 9 / 12 in the 100-unit viewBox, the ink edge 3 more, radius 41.
    - `TIMER_COLOR_SHIFT` now also transitions `stroke-width`; the sweep never transitions.
  - **Clock logic moved to `lib/countdown.ts`** for tests: `ringStage` (the opponent's and the waiting clock never escalate) and `arcDashArray` (linear, clamped map onto the 270° arc), with `ARC_SPAN`.
  - **Lives below 360px:** the big count hides and the shirts drop to 20px. The column is about 82px wide at 320px. This extends Pro Polish C's "bare shirts" rule. The role="img" label still says the count.
  - **Lost life:** the dashed outline uses `fill-transparent`, not `none`, so the fill fade still animates.
  - **Shirt tiles are gone,** so `LIFE_LOST_BORDER_SHIFT` and its test row were removed. `isTiled` became `isLarge`.
  - **The shirt change reaches every `Lives`:** the run summary, the duel result and `/dev/lives` also show dashed lost shirts and no tiles. B3 and stage E start from that.
  - **Guess input:**
    - live: ink border with a small hard shadow (was a blue border);
    - pending, locked and cooldown: flat, with no shadow;
    - cooldown: no amber border, since the amber countdown line under it explains the lock.
  - **Suggestions:** `rule` dividers between rows. Named rows get a grey "Named" tag and a 60% avatar.
  - **Practice:** a mint tile with Lucide `TimerOff`, as a rail section.
  - **Production build** not run during implementation, to avoid writing `.next` while the user's dev server runs (the stale-CSS issue). It ran and passed with the server stopped, before completion.
