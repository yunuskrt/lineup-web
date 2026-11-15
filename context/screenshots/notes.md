# Reference Notes

Fill this in as you collect (see `context/docs/ui-redesign-references.md` § 14).

## Direction

**Matchday Sticker** (2026-11-14), from brutal-01, brutal-02, other-01 and other-02: cream background, pastel blocks (lavender, mint, butter, coral, a lime pop), thick dark outlines, hard offset shadows, chunky wide headings, tilted sticker tags. No illustrations or doodles (changed 2026-11-14).

- sports-01, game-02, minimal-01: kept for card layout and the lavender tone only
- game-01: not this direction (flat clip-art illustrations)

## Palette

<!-- Hex codes of the palettes you liked, e.g. palette a: #F7F3EE #FFD6A5 #CAFFBF ... -->

palette a: #ccd5ae","#e9edc9","#fefae0","#faedcd","#d4a373" <!-- base: page background (#fefae0 cream), surfaces and soft panels; #d4a373 a muted accent -->
palette b: #C4B5FD #A7E3C4 #FFD972 #FF9F8A <!-- pastel blocks: lavender, mint, butter, coral for cards, sections, stickers, buttons -->
palette c: #7FB2F5 #FF9E6D <!-- duel: blue = you, orange = opponent (turn indicator, lives card, found slots, the clock on each turn). Colourblind-safe -->
palette d: #4CAF6E #FFB938 #F0564A <!-- status: green = correct, amber = clock warning (7–4s), red = clock critical (3–0s) and life lost. Keep warning/critical distinct from the orange opponent colour, e.g. ring weight or pulse. Tags use the pale 07-chips-a tints instead -->
ink: #1F1B16 <!-- warm near-black for text and the thick outlines; 16:1 on the cream -->
<!-- picked 2026-11-14 from the suggested options: b3, c1, d1; ink picked 2026-11-15 -->


## Fonts

<!-- Font names: headings and numbers, then body text -->

Decided 2026-11-14, close to the other-01 heading. Both are Google Fonts the app already loads (latin + latin-ext, Archivo with its width axis).

- **Headings and numbers: Archivo**, variable: weight 100–900, width 62–125. Checked: tabular digits (`tnum`), Turkish `locl`, and every İ ı Ş Ğ Ç Ö Ü Ł Č Ć Š Ž Ø Ñ Ę Ń glyph.
- **Text: Inter.** Neutral and clear at small sizes, like other-01's body text.

| Role | Font | Weight | Width | Used for |
| --- | --- | --- | --- | --- |
| Display | Archivo | 800 | 125 (112 below `md`) | Home headline, big section statements |
| Title | Archivo | 800 | 112 | Page and card titles: "Profile", "Run ended", "Perfect clear", "You won" |
| Long title | Archivo | 700 | 100 | Titles over ~20 characters: gate and dialog lines like "Hosting a room needs Pro" |
| Numbers | Archivo | 900 | 125, tabular | Clock seconds, score, home rule numbers (11, 15, 3), stat values |
| Room code | Archivo | 800 | 112, tracked out | The 6-character code. Safe: the code alphabet has no 0/O, 1/I or L |
| Sticker | Archivo | 800 | 112 | "Your turn", "Found", "Pro", "Practice". The only place uppercase is allowed, one or two words |
| Wordmark | Archivo | 900 | 125 | "Lineup" |
| Big call to action | Archivo | 800 | 112 | "Play", "Start" |
| Text | Inter | 400 / 500 | — | Paragraphs, labels, inputs, suggestions, toasts, dialog text, rows |
| Player names | Inter | 600 | — | Slots and lists; long names stay readable when small |
| Buttons | Inter | 600 | — | Every other button |

**Why the width changes:** measured at weight 800, "Beat the Clock." is 9.5em wide at width 125 and 8.5em at 112. On a 320px phone (288px of content), width 125 caps that line at about 30px, width 112 allows about 34px. So 125 is for desktop display and numbers, 112 for phone display and every title, and 100 for long titles.

**Numbers** (2026-11-15): stay Archivo width 125, weight 900, against the DIN-style `foundations/03-numerals-a`. Borrowed from it: the slashed zero (Archivo's `zero` feature) on the clock and scores.

**Starting sizes** (tuned in stage A): display 72px desktop / 34px phone, line height 1.0; title 40 / 30; section title 28 / 24; card title 20; text 16, line height 1.5; small 14; caption 12. Clock seconds 64px.

## Motion links

<!-- Links to animations you love: Dribbble shots, 21st.dev components, websites -->

## Per-image notes

<!-- One line each, e.g. game/05-timer-b: love the thick ring -->

- foundations/03-numerals-a: only the slashed zero; digits stay Archivo wide
- foundations/07-chips-a: tag shape (icon + label, tint per meaning); add the ink outline, use ink or dark text for contrast
- layout/01-header-desktop-a, 02-header-mobile-a: layout only (wordmark left, few links, menu button on phones); the open phone menu is the neobrutalism.dev Sheet
- layout/03-footer-a: one quiet line
- layout/08-locked-a: Free vs Pro comparison, better for /pro (§ 11); the in-place ProLock is composed from Button, a Pro badge and a lock icon
- layout/09-empty-state-a, 10-error-state-a: layout only (centred title, one line, one action). No illustration: neobrutalism.dev Empty with a Lucide icon in an outlined tile
- game/01-scoreboard-a, 01-scoreboard-b: layout only (crest over its name, big score beside each crest, context in the centre); not the dark gradients
- game/02-pitch-a: muted, soft tone; 02-pitch-b: flat pitch, clean outlines; 02-pitch-c: formation layout, name and number under each photo
- game/03-slot-a to 03-slot-c: found slot (round photo, name below, number); 03-slot-d: empty slot as outlined circle over two outlined bars
- game/05-timer-a: open arc with round ends, big centred number, pale track
- game/12-pick-side-a: layout only (round choices, chosen one outlined with a strong label, others muted); one tap picks, no Next step
- game/00-desktop-a: layout only (header card on top, pitch card left, side panel right); our pitch stays upright, not sideways
- game/00-mobile-a: layout only (score pill, title, formation of photo cards); we have no shirt numbers, so slots show the position until found
- game/15-results-a: layout only (title, check/cross table, totals, actions at the bottom); the you-vs-opponent columns fit the duel result later

Decided 2026-11-15 for stage B: mint turf #A7E3C4 with ink lines; clock warning amber + thicker ring, critical red + thicker + pulse; RevealCard and LivesCard designed without references (see the guide § 4)

## Dislikes

<!-- Anything you don't want -->
