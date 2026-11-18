# Fix — Conventions A: Shell and Providers

## Status

Completed

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-a. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/shell`, `components/providers`.

- **1.** `shell/NavAccount.tsx`: template (Props none). Importer: SiteNav.
- **2.** `shell/NavArchive.tsx`: template (Props none). Importer: SiteNav.
- **3.** `shell/NavCta.tsx`: template (Props none). Importer: SiteNav.
- **4.** `shell/QuitChip.tsx`: template (`QuitChipProps` → `Props`). Importer: GameCanvas.
- **5.** `shell/SiteNav.tsx`: template (Props none). Importers: `app/not-found.tsx`, `app/(site)/layout.tsx`.
- **6.** `shell/SiteFooter.tsx`: template (`SiteFooterProps` → `Props`). Importers: `(landing)/layout.tsx`, `(pages)/layout.tsx`, `app/dev/landing/page.tsx`, NotFoundView.
- **7.** `shell/StateNotice.tsx`: template (`StateNoticeProps` → `Props`); `type StateNoticeTone` stays named. Importers: ArchiveView, ProfileNotice, HistoryList, HistoryMore, RetryNotice.
- **8.** `shell/NotFoundView.tsx`: template (Props none); `NOT_FOUND_TITLE` stays named. Importers: `app/not-found.tsx`, `app/(site)/not-found.tsx` (mixed).
- **9.** `providers/QueryProvider.tsx`: template (`QueryProviderProps` → `Props`). Importer: `app/layout.tsx`.

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
  - B5: `/`, `/play`, `/profile`, `/archive`, `/sign-in`, `/nope` (404) at 320, 768 and 1280, and one game state with the quit chip (`/play/solo?state=warning`, frozen-clock rule).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **Empty props:** `type Props = {}` with `({}: Props)` passes lint as configured; no ESLint change was needed.
  - **Importers:** 18 import lines changed across 15 files (2 of them, SiteNav and NotFoundView, in this batch), as the audit listed (`StateNotice` also in `RetryNotice`, added by refactor-d).
  - **B5 timing (guide updated):** `/play@320` looked odd only in shots taken while the dev server recompiled after a stash restore (mid-load captures, thousands of pixels off); once settled, 5 of 5 branch shots were byte-identical to the baseline. The guide's A/B rule now says to discard the first loads after a stash or restore.
  - **Standards follow the decisions (review):** `coding-standards-web.md` now carries the 2026-11-19 decisions the guide records (`<Name>Props` in multi-component exempt files, exported props types with a `Props` alias, `props` for union or generic props, sibling `styles.ts`, JSX comments), so the auditor and later batches read one rule.
