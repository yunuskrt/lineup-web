# Redesign B2 — Rail: Clock, Lives and Guess Box

## Status

Not Started

## Goals

The second part of redesign stage B: everything in the rail card while a game is live. Depends on B1 (the rail card itself). **Behaviour, copy, timing and accessible names don't change**: the clock still renders from the server timestamp, and nothing here decides anything.

- **Rail order.** From `lg`: the turn sticker and the clock, then the lives card, then the guess box at the bottom (as today). On phones: the clock and the lives card side by side in a compact band, the guess box below. The 320px band rules from Pro Polish C stay: bare shirts under 360px, and the reconnect chip wraps under 414px.
- **Turn indicator.** The duel clock label ("Your turn" / "Their turn") becomes the A2 sticker `Badge` in the actor's tone (`you` / `opponent`), above the clock. Solo keeps its quiet label, hidden below `lg` as today. The live-region announcement is unchanged.
- **`CountdownRing`**, as in `game/05-timer-a`:
  - an **open arc** (about 270°, the gap at the bottom) with round caps, on a `rule` track of the same arc;
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
- **`Lives` and `LivesCard`** (guide § 4, designed without a reference): an outlined card shaped like a streak card.
  - a "Lives" label, then a **big number** (lives left, `TYPE_NUMBER`) beside a row of our three shirts;
  - a remaining life is a shirt filled in the owner's colour with an ink outline. A lost one is an empty **dashed** outline (`fg-dim`). The bordered tiles around each shirt go.
  - the lg-only hint line stays.
  - **Duel:** the card shows whoever's turn it is, as today. Their name sits in a sticker `Badge` in their tone in the card's header, and their shirts are in their colour. The peek dots, the hold-on-drop timing and the reconnect chip keep their behaviour; the dots take the new outline.
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
- **`PracticeCard`** on the accepted `Card`: "Practice" in `TYPE_CARD_TITLE`, the existing line in `fg-muted`, a mint (`block-mint`) header strip or tile so it reads as information. Copy unchanged.
- **Their turn:** the waiting line ("Waiting for {handle}…") stays text, in the input's cell, with no shift on handover.

## Out of Scope

- The reconnect chip and the reconnecting overlay (stage E restyles them; B2 only keeps them placed).
- The gate, the side pick and the summary (B3).
- New motion beyond what exists.
- Sound: no cue changes.

## Open Questions

1. **The combobox engine.** neobrutalism.dev's Combobox is built on Base UI's Combobox. Ours is hand-built and tested: focus never leaves the input, Enter submits free text that matches no row, named rows are inert, and the shake, pending and cooldown states all hook in. **Default: keep our component and adopt only the look.** The alternative, swapping to Base UI's Combobox, risks those behaviours for no visible gain.
2. **The normal-stage colour in solo.** **Default: blue (`you`)** in solo and in a duel, as guide § 4 says ("the owner's colour"). The alternative is ink in solo, where there's no opponent to tell apart.

## Notes

- **References:** `context/screenshots/game/05-timer-a`; guide § 4 (`CountdownRing`, `Lives`, `GuessInput`, `PracticeCard`); theme.md § Rules and § States (duel your turn, their turn, solo).
- **Rules to keep:** the clock is drawn from the server timestamp, linear, with three stages; whose turn it is shows by label as well as colour; reduced motion never stops the clock.
- **Contrast:** check the arc colours against white at each weight (≥ 3:1 for the graphic), and the numbers in their `-text` shades. Add any new pair to `src/styles/contrast.ts` tests.
- **Check:**
  - `/dev/ring`: all three stages, the opponent's turn, waiting, reduced motion;
  - `/dev/lives`: solo, duel, a drop, a peek, reconnecting;
  - `/dev/guess` and `/dev/feedback`: every input state, the popup with named rows, the keyboard;
  - `?state=` snapshots;
  - 320px, 360px, 414px, `lg`.
- Then B3.
