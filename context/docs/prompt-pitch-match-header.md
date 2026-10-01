# Prototype Prompt — Pitch, Match Header & Player Images

Paste everything below the line into the design tool. Save the three results in `context/screenshots/` as `pitch-header-desktop.png`, `pitch-header-tablet.png` and `pitch-header-mobile.png`. They are a reference, not a spec (see `design.md` § Scope).

The faces and crests the tool generates are placeholders for composition only. Real player photos and club crests carry a licensing risk the rest of the data doesn't (`project-overview.md` § Data Architecture), so never ship anything taken from the generated designs.

---

Design the gameplay pitch for **Lineup**, a football trivia game. Tagline: _Know the XI. Beat the Clock._

## What the player is doing

The player is shown one team from a historical match and must name its **starting XI**, which is 11 players, from memory. Each round has a 15-second clock. Naming a correct player reveals them on the pitch and starts the next round. If the clock hits zero, the player loses one of 3 lives.

This design is about the **pitch card**: the match header on top of it, and the 11 player slots on it. The control rail beside it (clock, lives, input) already exists. Keep it simple and recognisable, and don't redesign it.

Design the **solo game screen, mid-run**: 5 of 11 players found, 2 lives left, 9 seconds on the clock.

## The match (use exactly this)

All clubs, competitions and players are fictional. Don't replace them with real ones, and don't draw any real club's crest.

- **Home:** Yıldırımspor, short code `YLD`. The player is naming **Yıldırımspor's XI**, in a 4-1-4-1.
- **Away:** FC Weerdam, short code `WEE`.
- **Score:** Yıldırımspor 2, FC Weerdam 1.
- **Competition:** Federation Trophy.
- **Date:** 9 May 2012.

## Match header (top of the pitch card)

Two lines, centred on the card. The scoreline is the header's lead, like a printed result:

```text
[YLD crest] Yıldırımspor  2 – 1  FC Weerdam [WEE crest]
Federation Trophy        9 May 2012
```

- **Line 1:** the home crest, home name, home score, a dash, away score, away name, then the away crest. The scores are large tabular figures, set close to the dash so they read as one scoreline.
- **Line 2:** the competition name and the match date, in smaller secondary text.
- **Which XI is being named:** mark Yıldırımspor as the side being guessed, for example with an amber underline or a small "Naming this XI" tag under the home side. The away side stays plain. The player must never wonder which team's players to name.
- **Progress:** keep a small "5 / 11" count at the right edge of the header.
- **Crests:** flat, simple shield badges built from the club's short code and two colours. No detailed artwork, no photos. When a crest is missing, the same shield shows just the short code, and nothing moves.
- The header sits **inside** the pitch card, never above it as a page title.

## Pitch

- Drawn with lines, not a photo or image: halfway line, centre circle, penalty boxes.
- Markings are only one shade lighter than the pitch surface, subtle and never white.
- Goalkeeper at the bottom, the striker at the top.
- 11 slots in a 4-1-4-1: the goalkeeper, a back four, one holding midfielder, a midfield four, and one striker.

## Slots

**Found players (5).** Only the **player image** and the **player name**. No position label, no initials badge.

- The image is a round or tightly rounded headshot sitting above the name.
- The name sits under it in Inter Medium, cream, wrapping to two lines rather than truncating.
- Found players here:
  - **Onur Işıklar** (goalkeeper)
  - **İlker Doğançay** (defender)
  - **Oğuzhan Şimşek** (holding midfielder)
  - **Gökhan Erçetin** (midfielder)
  - **Hakan Tüzün** (striker)
- Show **one found player without an image**: Gökhan Erçetin. His slot shows his initials, **GE**, on a plain disc of the same size, so a missing photo never shifts the layout or looks broken.
- The names use Turkish letters (İ, ı, ş, ğ, ç, ü, ö). They must render in the chosen font without falling back mid-word.
- Names elsewhere in the game are much longer, like _Christophe Delacroix-Morel_ and _Jasper van der Linde_. Show slots that would fit those on two lines at the same slot size.

**Not-found players (6).** An outlined slot of the **same size and shape** as a found one, with an empty image placeholder and only a small position label: GK, DF, MF or FW. No name, no hint. The player must always see how many are left.

**Every slot is the same size**, found or not, so revealing a player never moves anything on the pitch.

## Control rail (keep as is)

- **Desktop:** to the right of the pitch card. From top to bottom:
  - a small "Round clock" label;
  - a large countdown ring with the number **9** and a small "seconds" caption inside;
  - a "Lives" card with three shirt-shaped pips in bordered tiles, 2 amber and 1 dim;
  - a text field at the bottom with the placeholder "Name a player…", the only primary action on screen.
- **Tablet and mobile:** below the pitch, as one compact band. The ring sits on the left, the Lives card on the right, and the text field runs full width underneath.
- One small "Quit" chip in a top corner, well away from the text field.

## Responsive

Design **three versions of the same screen, in the same state**, shown side by side:

- **Desktop, 1440 × 900.** Pitch card on the left, about two-thirds of the width, with the rail on the right. The header shows full club names. Fits without scrolling.
- **Tablet, 834 × 1194 (portrait).** Pitch card on top at full width, with the rail band below it. Full club names still fit. Fits without scrolling.
- **Mobile, 390 × 844.** Pitch card at full width on top, then the rail band.
  - The header's first line switches to short codes with crests: `[crest] YLD 2 – 1 WEE [crest]`. The competition and date line stays under it.
  - Player images shrink, but names stay readable and wrap to two lines.
  - Never scroll sideways.

## Palette (use exactly these)

| Role                                       | Hex       |
| ------------------------------------------ | --------- |
| App background, unfound slot fill          | `#0A0F0C` |
| Raised panels, pitch card                  | `#121A15` |
| Cards, found slots, image placeholder disc | `#1A241E` |
| Borders, dividers                          | `#27352C` |
| Pitch markings, unfound slot outline       | `#2F4036` |
| Primary text (cream)                       | `#F2EFE6` |
| Secondary text, labels, competition, date  | `#9BA79E` |
| Placeholder, disabled, position labels     | `#5F6D64` |
| Brand / "you" / the XI being named         | `#FFC043` |
| Opponent (duels only)                      | `#4C9AFF` |
| Correct, newly found                       | `#5FE388` |
| Timer warning                              | `#FF8A3D` |
| Timer critical, life lost                  | `#FF4A4A` |

Text on amber or green must be `#0A0F0C`, never cream. Crest colours may go beyond this palette, but keep them flat and muted so they don't compete with the clock.

## Type

- **Archivo** (expanded or black weight) for the club names and the scoreline.
- **Archivo with tabular figures** for the scores, the count and the countdown number.
- **Inter** for UI, and **Inter Medium** for player names.

## Form rules

- 4px spacing grid. Corners are tight: 4px on chips and inputs, 8px on cards and slots, 12px on panels. Full rounding only on headshots, the initials disc and small badges. No pill shapes elsewhere.
- **No drop shadows.** Separate layers with 1px borders and slightly lighter backgrounds.
- No gradients, no glassmorphism, no glow, no photo backgrounds.
- No all-caps eyebrow labels above the header. Don't join metadata with middle dots; give the competition and date their own space on line 2.

## Optional: state switcher

If the tool supports interactivity, add a small, clearly separate dev switcher that shows these states on the same screen:

- **Correct:** an unfound slot fills with the player's image and name, with a brief green flash that settles to the card colour.
- **Already named:** an existing found slot pulses once in grey, and a toast says "Already named".
- **Duel:** the same pitch in a 1v1 duel. A player found by you has an amber ring around the headshot, and one found by your opponent has a blue ring. Show both.
- **Masked header:** the header as the game currently shows it before the run ends: Yıldırımspor and its crest shown, while the opponent, both scores, the competition and the date are masked placeholder bars.
- **Run over:** the 6 unfound slots now show the missed players' names in secondary text, with no image, under their position label: Barış Kılıç, Serkan Aydoğdu, Çağlar Yüce, Emre Karagöz, Kerem Şahin, Selim Akbaş.
- **Loading:** the header as two flat bars at the size of its two lines, two crest-sized blocks, and 11 flat slot shapes in formation. No shimmer; at most a slow opacity pulse. Nothing may shift when the real content arrives.
