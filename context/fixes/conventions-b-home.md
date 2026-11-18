# Fix — Conventions B: Home

## Status

Completed

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-b. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/home`.

- **10.** `CountUp.tsx`: template (inline props → `Props`). Importer: HomeArchive.
- **11.** `HomeFold.tsx`: template (`HomeFoldProps` → `Props`). Importers: landing page, LandingStatePreview.
- **12.** `HomeModes.tsx`: template (Props none). Importers: landing page, LandingStatePreview.
- **13.** `HomeRules.tsx`: template (Props none); imports the marks from their new files (item 17).
- **14.** `LandingSkeleton.tsx`: template (inline → `Props`). Importers: HomeArchive, HomeInside.
- **15.** `HomeArchive.tsx`: split ArchiveBand, ArchiveSkeleton, ArchiveTiles → `home/home-archive/<Name>.tsx`; template. Importers: landing page, LandingStatePreview (ArchiveBand, new path).
- **16.** `HomeInside.tsx`: split StripSkeleton, LogoStrip, InsideLists, InsideBand → `home/home-inside/<Name>.tsx`; template. Importers: landing page, LandingStatePreview (InsideBand, new path).
- **17.** `RuleMarks.tsx`: split SlotsMark, ArcMark, PipsMark → `home/rule-marks/<Name>.tsx`; the shared constants (SLOTS, PIPS, STILL) and the exported `MarkProps` move to `home/rule-marks/marks.ts`; **`RuleMarks.tsx` is deleted** (decision, user 2026-11-19). Importer: HomeRules.
- **18.** `ShowcaseFrame.tsx`: split WindowBar, Stage, Caption, ShowcaseStill, ShowcaseDemo, HomeShowcase → `home/showcase-frame/<Name>.tsx`; template. Importers: HomeFold (HomeShowcase, new path), LandingStatePreview.

## Out of Scope

- Anything beyond the template, the splits and their imports: no renames (e.g. `ArchiveSkeletonRows` keeps its name), no copy, class or logic changes.
- Other folders' files, except updating their imports of a component changed here.

## Notes

- **Source:** `convention-auditor` report, step 3.1 of the guide; numbers are its item numbers.
- **Rules:**
  - **The template** (`coding-standards-web.md`): `import React from 'react'` (after `'use client'` when present), `type Props = {…}` (even empty), `const Name = ({…}: Props) => {…}`, `export default Name`. Non-component exports (constants, types) stay named beside the default.
  - **A split moves code unchanged** into `<parent-kebab>/<Name>.tsx` beside the parent. No change to copy, classes, markup order, ARIA, refs, hooks or behaviour.
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - B5: `/` at 320, 768 and 1280 (reduced motion on), `/dev/landing` and its `?state=` views; B8: the home page with reduced motion off (demo loop, count-up, marquee).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **17, `marks.ts`:** it holds only what several marks share (`STILL`, `MarkProps`, `staggered`). `SLOTS` and `PIPS` are each used by one mark, so they stay in `SlotsMark` and `PipsMark`, with `SLOT_RADIUS`, `ARC_RADIUS` and `ARC_SWEEP`; the spec had listed them as shared.
  - **18, shared non-class values:** `NO_SUGGESTIONS` and `STILL_STAGE` go to `showcase-frame/shared.ts`, beside `styles.ts` (`FIGURE`), since the decision covers class constants only.
  - **`'use client'` (review):** only parts that use hooks keep it (`ArchiveTiles`, `ShowcaseDemo`, `Stage`, the three marks, `HomeShowcase`). Nine pure-markup parts dropped it, as the standards ask (`Caption`, `WindowBar`, `ShowcaseStill`, `InsideLists`, `StripSkeleton`, `LogoStrip`, `ArchiveSkeleton`, `ArchiveBand`, `InsideBand`); every importer is a client component, so nothing moves to the server.
  - **`HomeShowcase` (review):** it wraps `ShowcaseFrame` and only `HomeFold` uses it, so it lives in `home/home-fold/HomeShowcase.tsx`, not `showcase-frame/`.
  - **`Stage` (review):** it destructures its props like every other component; its props are neither a union nor generic.
  - **Recheck after the review fixes:** `/` at three widths, `/dev/landing` and its `still` and `loading` states match `main` byte for byte (loading after six retakes); lint, types, 1,678 tests and the build pass.
  - **Unchanged-code check:** all 38 component bodies, helpers and constants of the old files, and all their comments, appear verbatim (whitespace aside) in the new files.
