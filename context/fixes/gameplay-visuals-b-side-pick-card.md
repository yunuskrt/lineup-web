# Fix — Gameplay Visuals B: Side-Pick Card

## Status

Not Started

## Goals

- **The "Pick your side" gate becomes a match card.** Before a solo run, the gate over the dimmed pitch shows the whole match, and the player picks a side by its crest:
  - **Context line:** the competition logo (`CompetitionLogo` from Gameplay Visuals A, 20px) and name, then the match date, formatted as the scoreboard does ("8 April 2008"). The name truncates; the date never does.
  - **Two team tiles,** home on the left and away on the right, with the **final score** between them ("2 – 0", tabular figures, `font-display`, 24px on phones and 32px from `sm`). The 64px size stays reserved for the countdown.
  - **Each tile is one button:** the crest, then the club's full name under it (`font-display`, 16px semibold, wrapping to at most two lines, then clamped). Clicking or tapping anywhere on the tile picks that side. There's no separate button.
  - **Title and detail stay:** "Pick your side" (the gate's title, announced as today), then "You'll name the starting XI of the team you pick."
- **Crest size.** `ClubCrest` gains a `size` prop: `'header'` (today's 32 / 40px, the default) and `'card'` (64px below `sm`, 80px from `sm`). The `'card'` fallback, used when `crestUrl` is null or fails, is the `shortName` at 16px on `surface-card` in the same box.
- **Tile states:**
  - **Rest:** `surface-card`, a 1px `line` border, `rounded-md`.
  - **Hover:** the border turns `brand`, and the crest lifts 2px. The lift is a Motion `whileHover`, never a CSS transition on the same property.
  - **Focus:** the shared `FOCUS_RING`.
  - **Pressed and in flight:** while `chooseSide` runs, both tiles are inert. The existing `isChoosing` guard already drops a second click; the tiles say so with `aria-disabled` and `fg-muted` names, so a slow request doesn't read as a dead click.
- **Accessible names.** Each tile is labelled "Name Chelsea FC's starting XI, home side" (or "away side"), so a screen reader doesn't hear only "Chelsea FC". Visually, the left/right position carries home and away. The score reads as "2 to 0", as on the scoreboard. The competition line is plain text.
- **Entrance motion (decided: entrance only).**
  - When the gate opens, the home tile slides in from the left and the away tile from the right (24px, with opacity), meeting at the score. 320ms, `easeOut`, both tiles together. The score fades in over the same 320ms.
  - Nothing moves afterwards except the hover lift.
  - **Two new motion effects** in `MOTION_EFFECTS`: `sidePickSlide` and `sidePickHoverLift`, both `drop` under reduced motion. With reduced motion the tiles appear with the panel (`gateFade` still runs), and hover changes only the border.
  - **Duration:** a `sidePickEntrance: 320` entry in `MOTION_DURATION_MS`, with the `motion.test.ts` checks extended to cover it.
- **Gate model.**
  - `CanvasGateView.choices` is replaced by `sidePick?: { match: MatchIdentity }`. `CanvasGateChoice` and `GateAction`'s choice branch go, since solo was their only user.
  - `gateOf` in `src/lib/solo-run.ts` builds `sidePick` from `state.offer.match`.
  - `onGateAction('home' | 'away')` is unchanged, so `SoloGame` doesn't change.
- **Gate size.** The side-pick card uses the gate's `'wide'` panel (`max-w-xl`). Every other gate keeps its size.
- **Contract (needs backend R4 Part 1).**
  - `soloMatchOfferSchema` gains `match: matchIdentitySchema`, required.
  - `home` and `away` stay in the schema because the backend still sends them, but the card reads only `match`.
  - **Mock:** `solo.findMatch` returns `match` from the chosen fixture's identity.
  - **Tests:**
    - `solo-run.test.ts`: the gate carries the offer's match.
    - a schema test: an offer without `match` is rejected.
- **Dev:** `/dev/canvas?state=side-pick` shows the card on `SAMPLE_IDENTITY`. A second state, `side-pick-long`, has two long club names (for example "Borussia Mönchengladbach" against "Wolverhampton Wanderers") to check the two-line clamp at 360px.
- **Docs:**
  - **`context/docs/data-display-requirements.md` § 1:**
    - a `crestUrl` row for the side-pick card: 64×64 below 640px and 80×80 from 640px; 128 and 160 at 2×; on `surface-card` (#1A241E)
    - the crest's "Smallest source" and "Recommended export" become 160×160, or SVG, because the card is now the largest crest
  - **`context/docs/contract.md`:** `SoloMatchOffer` gains `match`.

## Layout

```text
┌────────────────────────────────────────────────────┐
│ Pick your side                                     │
│ You'll name the starting XI of the team you pick.  │
│                                                    │
│ [▣] Champions League                  8 April 2008 │
│ ┌───────────────┐                ┌───────────────┐ │
│ │               │                │               │ │
│ │    (crest)    │     2 – 0      │    (crest)    │ │
│ │     80px      │                │     80px      │ │
│ │  Chelsea FC   │                │  Fenerbahçe   │ │
│ └───────────────┘                └───────────────┘ │
└────────────────────────────────────────────────────┘
   ← slides in                          slides in →
```

At 360px the tiles sit side by side, about 110px wide, with 64px crests and the score at 24px between them.

## Out of Scope

- **The duel:** the server picks the side, so there's no pick card. The lobby's "Match retrieved" step is unchanged.
- The stage and the match nickname on the card (user chose the score only, 2026-11-06).
- Any idle or looping motion (user chose entrance only).
- The scoreboard (Gameplay Visuals A) and the summary (Gameplay Visuals C).

## Open Questions

Defaults stand unless changed at load:

- **Home and away carried by position alone** in the visible text (the user didn't pick the Home / Away caption). Screen readers hear it in the tile's label.
- **The title stays at the top** of the panel, as on every gate, rather than under the tiles.

## Notes

- **Source:** user request (2026-11-06), screenshot `context/screenshots/gameplay-pick-your-side-box.png`:
  - "the box should at least include home team crest, away team crest, home team name, away team name, competition logo, competition name, match date"
  - "user should click the according crest"
  - "a nice motion animation to push the user to select one team"
  - "it should spark a desire in the user to start the game"
- **Decisions (user, 2026-11-06):**
  - Card extras: **final score** only.
  - Motion: **entrance only.**
- **Depends on:**
  - **Gameplay Visuals A** for `CompetitionLogo`.
  - **Backend R4 Part 1** (`SoloMatchOffer.match`). Load this fix only once R4a is merged on the backend's `main`. The web parses `match` as required, so a web build ahead of the backend would refuse every solo offer in real mode.
  - **R4a is merged** (2026-11-06, backend `0d85bd2`). `home` and `away` are now deprecated in OpenAPI, and they equal `match.home` and `match.away`.
- **Hard Constraint 2:** `MatchIdentity` carries no player, so showing it before the pick reveals nothing of either XI. The duel lobby shows the same identity before play.
- **Design (`frontend-design`, inside `theme.md` and `design.md`):**
  - The crests are the one bold thing: 80px is the largest image in the app.
  - Everything else stays quiet: one context line, plain tiles, borders not shadows, tight corners.
  - No "VS" badge and no gradient: the score already sits where a "VS" would, and it's a real fact about the match.
  - One orchestrated moment: the entrance.
- **Constraints:**
  - Colours come from tokens only.
  - Motion animates `transform` and `opacity` only.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, at 1440, 390 and 360:**
    - the card shows the logo, competition, date, both crests and names, and the score
    - Federation Trophy shows the cup icon
    - clicking either tile starts the run on that side
    - a long name clamps at two lines
    - nothing overflows at 360
  - **Keyboard:**
    - the gate focuses the home tile on open
    - Tab reaches the away tile
    - Enter and Space pick
    - the focus ring is visible on both tiles
  - **Reduced motion (emulated):** no slide and no lift; the panel still fades.
  - **Slow request (throttled):** a second click is ignored and the tiles read as busy.
  - **Real mode (after R4a):** the offer parses, real crests load, and the competition shows its kind icon until logos exist.
