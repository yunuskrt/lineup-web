# Fix — Refactor B: Class Constants

## Status

Completed

## Goals

Phase 2 of `context/docs/code-cleanup-guide.md`, batch refactor-b. Item approved by the user on 2026-11-18 (refactor-scanner report, item 8). **The rendered class set of every element stays the same.**

- **8a.** `SECTION_LABEL` (`src/styles/classes.ts`) replaces its retyped literal `text-12 font-medium text-fg-muted uppercase` in `components/duel/LobbyPanel.tsx`, `components/game/GuessInput.tsx` and `components/game/LivesCard.tsx`.
- **8b.** `ICON_TILE` replaces its retyped classes in `components/home/HomeInside.tsx` and `components/game/PracticeCard.tsx`, with any extra classes those sites add kept beside it.
- **8c.** `ARCHIVE_LIST` (`components/archive/styles.ts`) and `HISTORY_LIST` (`components/profile/styles.ts`) are the same string: one `BOARD_LIST` in `classes.ts`, used by both style files.
- **8d.** `components/pitch/SquadSlot.tsx` `LABEL_FILL` spreads `DUEL_ACTOR_BG` for `you` and `opponent` instead of re-listing them.

A site where the swap would add, drop or change any class keeps its literal.

## Out of Scope

- Any class change, even a harmless-looking one. `components/ui/`. Dev-only `DEV_PREVIEW_BUTTON`.

## Notes

- **Source:** `refactor-scanner` report, step 2.1 of the guide.
- **Constraints:** compare each element's class list before and after as sets (order in the attribute doesn't matter to Tailwind).
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - B5: `/`, `/play` (Practice card), `/play/solo?state=warning`, `/play/duel?state=opponent-reconnecting` (live clocks: the frozen-clock rule), a lobby state, `/profile` and `/archive`.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **8c:** `ARCHIVE_LIST` and `HISTORY_LIST` stay, as `= BOARD_LIST`, so their four users (`ArchiveView`, `ArchiveSkeleton`, `HistoryList`, `ProfileSkeleton`) keep their imports. The "White, outlined, ink rules between rows" comment moved to `BOARD_LIST`.
  - **Class-set check:** old and new class strings compared as sets for every site: all identical.
  - **Follow-up, not this batch (review):** `profile/styles.ts` `STAT_LABEL` is `SECTION_LABEL` plus `leading-4`, and the same classes are typed out in `DuelResultPanel.tsx` and `RunSummary.tsx` (`<dt>` labels); not a pure swap, as `leading-4` is extra.
  - **`BOARD_LIST` comment (review):** it describes the style, not its current users.
