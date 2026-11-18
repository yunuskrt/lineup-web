# Fix — Conventions J1: UI Kit Template

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-j1. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/ui` (template only, no split, named exports kept).

- **98.** `alert-dialog.tsx`: arrow consts + `<Name>Props` for its four components; `AlertDialog`, `AlertDialogClose` aliases stay.
- **99.** `alert.tsx`: Alert, AlertDescription.
- **100.** `avatar.tsx`: Avatar, AvatarImage, AvatarFallback.
- **101.** `badge.tsx`: Badge; `badgeVariants` stays.
- **102.** `button.tsx`: Button.
- **103.** `card.tsx`: six components.
- **104.** `checkbox.tsx`: Checkbox.
- **105.** `empty.tsx`: six components.
- **106.** `input-otp.tsx`: InputOTP, InputOTPGroup, InputOTPSlot.
- **107.** `input.tsx`: Input.
- **108.** `label.tsx`: Label.
- **109.** `marquee.tsx`: Marquee (`MarqueeProps` → `Props`).
- **110.** `select.tsx`: five components; `Select` alias stays.
- **111.** `skeleton.tsx`: Skeleton; `SKELETON` stays.
- **112.** `switch.tsx`: Switch.
- **113.** `tabs.tsx`: four components.

Each file gets `import React from 'react'`; components become arrow consts with a props type: `Props` in single-component files, `<Name>Props` where a file has several (decision). Exports stay named, so no importer changes.

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
  - B5: `/dev/components` at 1280 and a sample of pages using the kit (`/play`, `/sign-in`, `/archive?state=open`, `/profile?state=populated`) at 320 and 1280.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
