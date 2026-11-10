# Fix — Landing E: Sections 2–6 Look and Motion

## Status

Not Started

## Goals

The landing page below the fold gets a cleaner look and a few quiet entrance animations (user, 2026-11-10). Everything stays in the current Floodlight theme, with no new colours and no new fonts; a full redesign comes later.

### Shared motion

- **One entrance pattern,** used by sections 2, 3 and 5 only: the first time a group is at least 30% in view, its items fade in and rise 8px, 60ms apart, over 320ms, ease-out. It plays once and never on scroll back.
  - A new `landingEntrance` motion effect (`drop`) and its durations in `src/styles/motion.ts` (`landingRise: 320`, `LANDING_STAGGER_MS = 60`), with `motion.test.ts` extended.
  - **Reduced motion:** everything is simply there; no fade, no rise, no count-up (as today).
  - `transform` and `opacity` only. The content is in the DOM and readable before and after; only its opacity changes.
- **Never on the fold or the modes:** the fold already has the demo, and section 4 stays still.

### Section 2: The archive

- **The era line goes** ("Seasons 2000–01 to 2025–26.").
- **Scoreboard tiles** (user, 2026-11-10): four tiles, 2 × 2 below `sm` and 4 in a row from `sm`.
  - Each tile: `rounded-md`, a 1px `line` border, `surface-raised`, padding 16px (24px from `sm`). A short brand bar (32 × 2px, `bg-brand`) at the top left, then the number, then the label.
  - The number: `font-display`, bold, `tabular-nums`, 32px below `sm` and 48px from `sm`. The label: `text-fg-muted`, 14px below `sm` and 16px from `sm`, wrapping to two lines if it must.
  - Tiles in a row share one height.
- **Motion:** the tiles enter with the shared pattern, and each number's existing count-up starts as its tile appears.
- **The skeleton** becomes four tiles of the same size.

### Section 3: How it plays

- **The dividers and the old table layout go.** Three columns from `sm`, stacked below.
- **Each rule gets a mark from the game itself** (user, 2026-11-10), about 48px tall, above its number:
  - **11:** eleven small empty slots in a 4-3-3 shape, drawn as outlined circles in the `marking` role token (`stroke-marking`), the border an unrevealed slot uses (`SquadSlot`).
  - **15:** a still ring arc, the countdown's stroke in `fg` over the `line` track, swept about two thirds. A static SVG, not `CountdownRing`.
  - **3:** the three shirt pips, the real `Lives` component with three lives.
- Under each mark: the number (`font-display`, 32px below `sm`, 48px from `sm`, `tabular-nums`) and the existing line of text (16px, 20px from `sm`, muted), unchanged in wording.
- **Motion:** the three columns enter with the shared pattern. Once, as its column appears:
  - the empty slots fade in one by one, 30ms apart;
  - the arc draws from empty to its two thirds over 600ms, **linear** (it is the clock's mark, and `theme.md` keeps the clock linear);
  - the shirt pips pop in one by one (opacity, 80ms apart).
  - Reduced motion: all three marks shown complete.

### Section 4: Two ways to play

- **Two panels side by side** from `sm`, stacked below: `rounded-lg`, a 1px `line` border, `surface-raised`, padding 24px. Each has its heading ("Solo", "Duel"), its line, and its buttons at the bottom; the two panels share one height.
- **Buttons, not links** (user, 2026-11-10):
  - "Play solo" and "Find a duel": the fold's Play style (`PRIMARY_BUTTON_LARGE`, amber).
  - "Play a friend": an outlined button of the same size, beside "Find a duel". A new `SECONDARY_BUTTON_LARGE` in `src/styles/classes.ts` (same padding and type as `PRIMARY_BUTTON_LARGE`, a 1px `line` border, `fg` text, `surface-raised` on hover).
  - They stay links (`<Link>`) with the same targets; only the look changes. On phones the Duel buttons wrap onto two lines if they must.
- **No motion** in this section.

### Section 5: What's inside

- **"Most-played clubs" goes.** A visible section heading, **"What's inside"**, sits over the whole section (user, 2026-11-10), in the same style as the Solo / Duel headings. The crest list keeps an accessible name, "Clubs with the most matches".
- **Motion:**
  - the competition logos and names enter with the shared pattern, 40ms apart;
  - the crests follow, 40ms apart, fading and scaling from 0.92 to 1;
  - the four highlight numbers count up once, as the archive's do (reusing `CountUp`).
- The skeleton keeps its shape under the new heading.

### Section 6: Closing

- **The footer's "Play" becomes a button,** the fold's Play style (`PRIMARY_BUTTON_LARGE`). Beside the statement from `sm`, below it on phones.

### Checks and tests

- `/dev/landing?state=ready`, `loading`, `down`, `long` and `still`, at 320, 375, 768, 1024 and 1440px:
  - no sideways scroll; tiles, columns and panels line up; the long-number state fits its tiles at 320;
  - skeleton heights match the loaded sections (measure the archive and inside, as in Landing A).
- Reduced motion: no entrance, no count-up, every mark complete.
- Keyboard: the four buttons are reachable in order, with the focus ring.
- **Tests:** the motion constants (`motion.test.ts`); any new pure helper (for example the 4-3-3 slot positions for the 11 mark) gets a test.
- **Real data:** on whichever database the backend runs (dev or ingest), the numbers and logos read right in the new layout.

### Docs

- `context/design.md`: the `/` row in § Page shape notes the mode buttons, and **§ One primary action per view gains the landing exception** (user, 2026-11-10): the lower sections carry amber mode buttons, two of them in one view (Solo and Duel side by side).
- `context/theme.md`: a short line under Landing demo for the landing entrance pattern and its reduced-motion rule.
- `context/docs/landing-page-improvements.md` § 5: the motion table updated (entrances on sections 2, 3 and 5, count-up on the highlights).

## Layout

```text
Archive (sm and up)
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│▔▔        │ │▔▔        │ │▔▔        │ │▔▔        │
│1,924     │ │3,786     │ │100       │ │26        │
│real      │ │players   │ │clubs and │ │seasons   │
│matches   │ │          │ │nations   │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

How it plays
 ○○○○○○      ◜‾‾◝         [shirt][shirt][shirt]
 ○○○○○      ◟   ◞
 11           15            3
 Starters to  Seconds a     Lives. Only the clock
 name, from…  turn. Name…   takes one. A wrong…

Two ways to play
┌─────────────────────────┐ ┌─────────────────────────────────┐
│ Solo                    │ │ Duel                            │
│ Your filters, your pace…│ │ Live 1v1 on one shared XI…      │
│ [ Play solo ]           │ │ [ Find a duel ] ( Play a friend )│
└─────────────────────────┘ └─────────────────────────────────┘

What's inside
[logo] Bundesliga  [logo] LaLiga  [logo] Champions League …
(crest)(crest)(crest)(crest)(crest)(crest)(crest)…
56 finals   53 penalty shootouts   84 went to extra time   5,343 goals

ELEVEN NAMES. FIFTEEN SECONDS.                     [ Play ]
```

## Out of Scope

- The fold and its demo: Landing D.
- **Dark logos and crests on the dark surface** (Ligue 1, Champions League, Premier League, Tottenham, Juventus are hard to see). It affects `/play` and the game too, so it is a separate, app-wide fix.
- New copy for the rules or modes beyond what is listed.
- Section motion on scroll back, parallax, or any looping animation.

## Open Questions

Defaults stand unless changed at load:

- **Entrance timing:** 320ms, 8px rise, 60ms stagger (40ms for logos and crests).
- **The 11 mark's shape:** a 4-3-3 of small circles; any formation reads as "eleven".

## Notes

- **Source:** user request (2026-11-10), with the choices made that day: scoreboard tiles for the archive; three columns with game marks for the rules; amber buttons with "Play a friend" outlined; one visible "What's inside" heading.
- **Order:** after Landing D (the two touch different files and can be built in either order; D first because it touches the fold).
- **The skill note for this phase:** `frontend-design` for layout and a templated-tells check, with `theme.md` and `design.md` as the brief.
