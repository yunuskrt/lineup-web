# Prototype Prompt — Solo Game Screen

Paste everything below the line into the design tool. Save the three results in `context/screenshots/` as `solo-game-desktop.png`, `solo-game-tablet.png` and `solo-game-mobile.png`. They are a reference, not a spec (see `design.md` § Scope).

---

Design a single screen for **Lineup**, a football trivia game. Tagline: _Know the XI. Beat the Clock._

## What the player is doing

The player is shown one team from a real historical match and must name its **starting XI** — 11 players — from memory. Each round has a **15-second clock**. Naming a correct player fills their slot on the pitch and starts the next round immediately. If the clock hits zero, the player loses one of **3 lives**. A wrong name costs nothing but time. The run ends at 0 lives, when all 11 are named (a "perfect clear"), or when the player quits.

Design the **solo game screen, mid-run**: 4 of 11 players found, 2 lives left, 9 seconds on the clock, input focused.

## Mood

"Floodlight" — night football, a 2000s archive, a clock running down. Tense, sharp, sporty, data-like. Near-black with a green cast, like a pitch under floodlights — not a grey dashboard. Warm cream text, never pure white. Retro without pastiche: no leather textures, no VHS scanlines, no neon glow.

## Layout

- **No navigation bar, no footer, no page heading.** This is an application view; everything that isn't the clock, the pitch or the input competes with the player.
- **The pitch is the composition** and starts at the top of the viewport. The match header sits _inside_ the pitch card, not above it.
- Clock, lives and input sit in a **control rail** beside or below the pitch (see Responsive). Never a toolbar above the pitch.
- One small **"Quit" chip**, placed well away from the input (e.g. a top corner).

## Responsive

The screen must be fully responsive. Design **three versions of the same screen, in the same state**, shown side by side:

- **Desktop, 1440 × 900.** Pitch card on the left and dominant, about two-thirds of the width. Control rail on the right: ring on top, lives below it, input at the bottom. Everything fits without scrolling.
- **Tablet, 834 × 1194 (portrait).** Pitch card on top at full width, capped so the pitch keeps its proportions rather than stretching. The rail sits below the pitch as a wider band: ring and lives side by side, input full width beneath them. The quit chip stays in a top corner. Fit the viewport without scrolling.
- **Mobile, 390 × 844.** Pitch card at full width on top. Below it, the ring and lives share one compact row, and the input is pinned at the bottom where the thumb and keyboard are. The quit chip stays in a top corner. Fit the viewport without scrolling, and never scroll sideways.
- The rail moves **below** the pitch on tablet and mobile. It never collapses into a hamburger menu or a drawer, because these controls are primary.
- The pitch scales down; it is never cropped. Slots stay readable at mobile width, and long names wrap to two lines rather than truncating.
- The ring keeps its large number on mobile. It is the one element that must not shrink into insignificance.

## Components

**Match header (inside the pitch card).** The match is partly masked until the run ends. Show the team and side: **Northgate United — Home XI · 4-4-2**. Show opponent, competition and date as masked placeholders (e.g. `? ? ?` chips or blurred bars).

**Pitch.** Drawn with lines, not a photo or image: halfway line, centre circle, penalty boxes. Markings are only one shade lighter than the pitch surface — subtle, never white. Goalkeeper at the bottom, forwards at the top. 11 slots in a 4-4-2.

**Slots.**

- **Unfound (7):** an outlined shape with only a small position label (GK / DF / MF / FW). No name, no hint. The player must always see how many are left.
- **Found (4):** a filled card with the player's name, and initials in place of a photo. Found here: **Gareth Pennock** (GK), **Rhys Harlow** (DF), **Jasper van der Linde** (MF), **Wes Tolland** (FW).
- Names can be long or accented (_Ciarán O'Donovan_, _Kofi Addo-Mensah_), so slots must fit two-line names cleanly.

**Countdown ring.** The emotional core of the screen. A stroked circle with a large number inside (64px, tabular figures), showing **9**. The ring empties linearly. Its colour escalates in three stages: cream (15–8s) → orange (7–4s) → red (3–0s). At 9s it is cream.

**Lives.** Three marks — a simple pip, ball or shirt shape, **not hearts**. Filled in amber, emptied to dim grey. Show 2 filled, 1 empty.

**Guess input.** One text field, focused, placeholder "Name a player…". It is the only primary action on screen. Submitting is by Enter; a submit button is optional.

**Progress.** A small count, "4 / 11", is fine. No score, no difficulty indicator.

## Palette (use exactly these)

| Role                                | Hex       |
| ----------------------------------- | --------- |
| App background                      | `#0A0F0C` |
| Raised panels                       | `#121A15` |
| Cards, found slots, input field     | `#1A241E` |
| Borders, dividers                   | `#27352C` |
| Pitch markings, unfound slot outline | `#2F4036` |
| Primary text (cream)                | `#F2EFE6` |
| Secondary text, labels              | `#9BA79E` |
| Placeholder, disabled, empty lives  | `#5F6D64` |
| Brand / "you" / primary accent      | `#FFC043` |
| Correct, newly found                | `#5FE388` |
| Timer warning                       | `#FF8A3D` |
| Timer critical, life lost           | `#FF4A4A` |

Text on amber or green must be `#0A0F0C`, never cream.

## Type

- **Archivo** (expanded or black weight) for the match header and display text.
- **Archivo with tabular figures** for the countdown number and counts.
- **Inter** for UI; **Inter Medium** for player names.

## Form rules

- 4px spacing grid. Corners are tight: 4px on chips and inputs, 8px on cards, 12px on panels. Full rounding for small badges only — no pill shapes elsewhere.
- **No drop shadows.** Separate layers with 1px borders and slightly lighter backgrounds.
- No gradients, no glassmorphism, no glow.

## Optional: state switcher

If the tool supports interactivity, add a small, clearly separate dev switcher that shows these states on the same screen:

- **Warning:** 5s, ring and number orange.
- **Critical:** 2s, ring and number red, gently pulsing once per second.
- **Pending:** a guess was submitted; the input is locked with a small spinner inside it, and the ring keeps sweeping.
- **Correct:** a slot fills with a brief green flash, then settles to the card colour.
- **Already named:** the existing slot pulses once in grey, and a toast says "Already named".
- **Not in this XI:** the input shakes and keeps its text, and a toast says "Not in this XI". The pitch does not change.
- **Life lost:** a pip empties, with a brief red flash across the screen.

The two "no penalty" cases must look different: _already named_ speaks through the pitch, _not in this XI_ speaks through the input.
