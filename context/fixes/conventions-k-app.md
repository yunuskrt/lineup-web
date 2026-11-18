# Fix — Conventions K: App Pages and Layouts

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-k. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `src/app` pages and layouts.

- **129.** `app/layout.tsx`: `type Props = LayoutProps<'/'>`, arrow const, default export.
- **130.** `app/(site)/layout.tsx`.
- **131.** `app/(site)/(landing)/layout.tsx`.
- **132.** `app/(site)/(pages)/layout.tsx`.
- **133.** `app/(game)/layout.tsx`.
- **134.** `app/not-found.tsx`.
- **135.** `app/(site)/not-found.tsx`.
- **136.** `(landing)/page.tsx` (`Home`).
- **137.** `(pages)/play/page.tsx` (async).
- **138.** `(pages)/profile/page.tsx` (`PageProps<'/profile'>`).
- **139.** `(pages)/archive/page.tsx`.
- **140.** `(pages)/pro/page.tsx`.
- **141.** `(pages)/sign-in/page.tsx`.
- **142.** `(game)/play/duel/page.tsx`.
- **143.** `(game)/play/solo/page.tsx`.
- **144.** `app/dev/canvas/page.tsx`.
- **145.** `app/dev/components/page.tsx`.
- **146.** `app/dev/feedback/page.tsx`.
- **147.** `app/dev/guess/page.tsx`.
- **148.** `app/dev/landing/page.tsx` (`PageProps`).
- **149.** `app/dev/lives/page.tsx`.
- **150.** `app/dev/loading/page.tsx`.
- **151.** `app/dev/pitch/page.tsx` and helper Specimen.
- **152.** `app/dev/pro/page.tsx`.
- **153.** `app/dev/reveal/page.tsx`.
- **154.** `app/dev/ring/page.tsx`.
- **155.** `app/dev/sound/page.tsx`.
- **156.** `app/dev/theme/page.tsx` and its section helpers (`<Name>Props` each).

Next's required default exports stay; the change is `import React`, a `type Props` (`LayoutProps<…>`, `PageProps<…>` or `{}`), and an arrow const. Route-config exports (`metadata`, etc.) stay named. Nothing imports a page or layout.

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
  - B5: every baseline page at 320, 768 and 1280 and every `/dev/*` page at 1280 (Finish-style sweep, A/B rule where needed).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
