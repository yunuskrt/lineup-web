# Redesign H2 — Pro Page and System States

## Status

Not Started

## Goals

The second part of redesign stage H (`/pro` and the system states, `context/docs/ui-redesign-references.md` § 11 and § 12). **Behaviour, copy, the Pro switch rule (`/pro` is a 404 while the split is off), the tier logic and accessible names don't change.**

- **`/pro`** (decided 2026-11-16; `layout/08-locked-a`, layout only):
  - an open page with ruled sections, as `/archive`: the header, then the table, then the action;
  - **header:** "Lineup Pro" in `TYPE_TITLE` and the line below, as today;
  - **`ProPlanTable`** (neobrutalism.dev Table): a white table in a 2px ink outline with 2px ink rules; the Pro column in lavender (`bg-block-lavender`, `on-accent`); a Lucide `Check` beside each Pro value and a `Minus` where Free has none, beside the words (screen readers keep "Not included"); it stays a real `<table>` with its `th` scopes;
  - **`GetProButton`** (reuse A2): the large primary Button, disabled, with "Pro isn't on sale yet." under it; **"You have Pro."** as a sticker `Badge` (the `brand` tone) with its `role="status"`; the slot keeps one height in every plan.
- **Not found (404)** (decided, reuse A3):
  - our own page in place of Next's built-in one, with the site's nav and footer;
  - a big "404" in `TYPE_NUMBER`, a tilted sticker `Badge` ("Off the pitch", open question 1), one line ("That page isn't in the game."), then **Play** (primary) and **Home** (secondary); no illustration;
  - the page title says "Not found".
- **Update required** (`ProtocolRefused`, decided, reuse A3): the `StateNotice` look with a Lucide `RefreshCw` icon tile, the same title and line, **Reload** as the large primary Button and **Back to Play** as a secondary Button (today a text link); the heading keeps its focus on arrival.
- **Rate limited** (decided, reuse B2): a check only. The locked guess box with its reason is already restyled; if its reason line isn't in the warning tone, it takes it.
- **Empty filter result** (decided, reuse B3): a check only. The game's `CanvasGate` with "Include every season" as the primary Button is already restyled.

## Out of Scope

- Checkout, prices or plans: Pro isn't on sale.
- The `ProLock` component (A3). New motion.

## Open Questions

1. **The 404 sticker.** **Default: "Off the pitch"**, in butter, tilted. The alternative is no sticker, just the number and the line.
2. **The 404 line.** **Default: "That page isn't in the game."** The alternative is plain "We couldn't find that page."

## Notes

- **References:** `context/screenshots/layout/08-locked-a`; no new images.
- **Docs:** check `node_modules/next/dist/docs/` for `not-found` in this Next version before adding the page (AGENTS.md).
- **Contrast:** text on the lavender column uses `on-accent` (tested).
- **New copy:** the 404 sticker and line (open questions), and "Not found" as its title.
- **Check:** `/pro` as Free and as Pro with the split on (`NEXT_PUBLIC_MOCK_TIER=free`, the user's step) and the 404 with the split off; any unknown URL for the 404; `/play/duel?scenario=protocolRefused` (the mock duel refuses the handshake) for update required; `/play/solo?state=rate-limited` and the `empty-pool-*` states; 320, 768 and 1280px; keyboard order; screen-reader names for the table.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- That ends the redesign's stages; the motion pass comes after.
