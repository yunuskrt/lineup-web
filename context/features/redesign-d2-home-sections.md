# Redesign D2 — Home Sections

## Status

Not Started

## Goals

The second part of redesign stage D: the bands below the fold on `/`. Depends on D1 (the band structure and `HOME_BAND`). **Behaviour, copy, the catalog data, the count-ups and accessible names don't change.**

- **`HomeArchive`** on a **lavender band** (`landing/03-stats-tiles-a`, plus the number tiles in `02-demo-frame-a`):
  - the four archive figures as **white tiles** with a 2px ink outline, `rounded-lg` and the hard shadow, in today's grid (two columns on phones, four from `sm`);
  - each tile: a **Lucide icon in a small outlined tile** overlapping its top-left corner, the big number (`TYPE_NUMBER`, with the existing `CountUp`), and the label under it;
  - icons by `archiveFigures` key: `matches` `Trophy`, `players` `Users`, `sides` (clubs and national teams) `Shield`, `seasons` `CalendarRange`;
  - `ArchiveSkeleton` keeps the same tile shapes, so nothing shifts; the band still hides when the overview fails, as today.
- **`HomeRules`** on the cream band (`landing/04-how-it-works-a`, layout only):
  - three **numbered colour blocks**, one per rule: **lavender** (11), **mint** (15), **butter** (3). Never blue or orange, which belong to you and your opponent;
  - each block: 2px ink outline, the hard shadow, the big number in `TYPE_NUMBER`, the existing `RuleMarks` mark beside it, and the existing line;
  - stacked on phones, three across from `sm`; the `dl` structure and the entrance stay.
- **`HomeModes`** on a **mint band**, reusing C1 (decided 2026-11-16):
  - the same option-card look as the `/play` mode cards: white, 2px ink outline, the hard shadow, a Lucide icon in an outlined tile (`User` for Solo, `Swords` for Duel), the title, the existing line, the you / opponent colour bars;
  - not a radio group here: each card keeps its links, **Play solo**, **Find a duel** and **Play a friend**, as today's large primary and secondary Buttons.
- **`HomeInside`** as an **ink marquee strip** with the neobrutalism.dev [Marquee](https://www.neobrutalism.dev/docs/marquee) (decided 2026-11-16):
  - copied into `src/components/ui/marquee.tsx` and adjusted to our theme; its two `marquee` keyframes go into the theme CSS;
  - the strip: the scoreboard ink with 2px ink rules above and below, the competition logos and club crests each in a small **white outlined tile**, so dark logos stay visible on ink;
  - **reduced motion:** no scrolling; the same tiles wrap as a still row;
  - the scrolling copy is decorative (`aria-hidden`); the existing "Competitions" and "Clubs with the most matches" lists stay available to screen readers once, and the "What's inside" heading and highlight figures stay under the strip on the page's cream;
  - the loading skeleton keeps the strip's height.
- **Closing band** (decided 2026-11-16): `SiteFooter`'s `statement` variant becomes a full-width **butter band** with an ink rule above it: "Eleven names. Fifteen seconds." in `TYPE_SECTION` and the large primary **Play** button. Other pages keep the inline footer line.

## Out of Scope

- The fold, the demo frame, the band structure and the tagline (D1).
- The catalog overview data, `CountUp` and the entrance timings.

## Open Questions

None. The band fills and block colours above are defaults; change them in review if a band reads wrong.

## Notes

- **References:** `context/screenshots/landing/02-demo-frame-a`, `03-stats-tiles-a`, `04-how-it-works-a`, and their lines in `context/screenshots/notes.md`.
- **New motion:** the Marquee is the only new motion in stage D. It loops only while visible, never on reduced motion, and carries no information.
- **Contrast:** text on lavender, mint and butter uses `on-accent` (tested). Add `contrast.ts` pairs for any `fg-muted` on those fills before using it; the logo tiles are white, so logos need no new pair.
- **Check:**
  - `/` at 320px, 360px, `sm`, `lg`;
  - the archive and inside bands loading, loaded and failing (the overview hidden);
  - reduced motion: the strip still, the count-ups as today;
  - keyboard: every mode link and the closing Play;
  - a screen reader hears each logo list once.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- **With D2 done, stage D is complete.** The next collection is stage E (`/play/duel`, guide § 7).
