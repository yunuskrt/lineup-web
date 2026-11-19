# Fix — Conventions J: UI Kit, Dev Previews and App Pages

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-j (merged batches, user 2026-11-19). Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folders: `components/ui`, `components/dev`, `src/app`.

### UI kit, template only (was conventions-j1)

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

### Dev previews, template only (was conventions-j2)

- **114.** `ArchiveStatePreview.tsx`.
- **115.** `CanvasStatePreview.tsx`.
- **116.** `ComponentsPreview.tsx` and its section helpers (`<Name>Props` each).
- **117.** `DevPreviewShell.tsx`.
- **118.** `FeedbackPreview.tsx`.
- **119.** `GuessPreview.tsx`.
- **120.** `LandingStatePreview.tsx`.
- **121.** `LivesPreview.tsx` and helper Specimen.
- **122.** `LoadingPreview.tsx`.
- **123.** `ProPreview.tsx` and helpers Specimen, SoloStartSample, PracticeSample.
- **124.** `ProfileStatePreview.tsx`.
- **125.** `ResolvedValue.tsx`.
- **126.** `RevealPreview.tsx`.
- **127.** `RingPreview.tsx` and helper Specimen.
- **128.** `SoundPreview.tsx`.
Each file gets `import React from 'react'`, arrow consts and a props type (`<Name>Props` where several components share a file). Exports stay named.

### App pages and layouts (was conventions-k)

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

- Anything beyond the template, the splits and their imports: no renames (`ArchiveSkeletonRows` in `components/archive` keeps its name), no copy, class or logic changes.
- Other folders' files, except updating their imports of a component changed here.

## Notes

- **Source:** `convention-auditor` report, step 3.1 of the guide; numbers are its item numbers.
- **Rules:**
  - **The template** (`coding-standards-web.md`): `import React from 'react'` (after `'use client'` when present), `type Props = {…}` (even empty), `const Name = ({…}: Props) => {…}`, `export default Name`. Non-component exports (constants, types) stay named beside the default.
  - **A split moves code unchanged** into `<parent-kebab>/<Name>.tsx` beside the parent. No change to copy, classes, markup order, ARIA, refs, hooks or behaviour.
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay; only split parts that use hooks, events, browser APIs or `motion` keep `'use client'`, and a part never gains a directive its parent lacked; a part other files also import goes top-level in the folder, not into the parts subfolder (2026-11-20); shared non-class values go to a sibling `shared.ts`; `import React` is always the first import, merged with any other `react` names.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - every moved component body, helper, constant and comment appears verbatim in the new files (script check);
  - B5 (UI kit, template only (was conventions-j1)): `/dev/components` at 1280 and a sample of pages using the kit (`/play`, `/sign-in`, `/archive?state=open`, `/profile?state=populated`) at 320 and 1280.
  - B5 (Dev previews, template only (was conventions-j2)): every `/dev/*` page at 1280, plus the `?state=` previews they back (`/profile?state=populated`, `/archive?state=open`, `/play/solo?state=warning`).
  - B5 (App pages and layouts (was conventions-k)): every baseline page at 320, 768 and 1280 and every `/dev/*` page at 1280 (Finish-style sweep, A/B rule where needed).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
